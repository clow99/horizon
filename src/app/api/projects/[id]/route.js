import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';

// PUT - Update a project
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Await params (Next.js 15 requirement)
    const { id } = await params;
    
    // Verify project ownership
    const projectCheck = await query(
      'SELECT user_id, archived, archived_at FROM projects WHERE id = ?',
      [id]
    );
    
    if (projectCheck.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    if (projectCheck[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const {
      name,
      description,
      client,
      target_date,
      status,
      tasks,
      changedTaskIds: changedTaskIdsRaw = [],
      deletedTaskIds: deletedTaskIdsRaw = [],
      archived,
      archived_at
    } = body;

    const formatDateTimeForMySQL = (value) => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    const changedTaskIdSet = new Set(
      Array.isArray(changedTaskIdsRaw) ? changedTaskIdsRaw.filter(Boolean) : []
    );
    const explicitDeletedIdSet = new Set(
      Array.isArray(deletedTaskIdsRaw) ? deletedTaskIdsRaw.filter(Boolean) : []
    );
    const isPartialTaskUpdate = changedTaskIdSet.size > 0;
    
    // Format target_date for MySQL (YYYY-MM-DD format)
    let formattedTargetDate = null;
    if (target_date) {
      const date = new Date(target_date);
      formattedTargetDate = date.toISOString().split('T')[0]; // Get just the date part (YYYY-MM-DD)
    }
    
    const archivedProvided = typeof archived !== 'undefined';
    const normalizedArchived = archivedProvided
      ? Boolean(archived)
      : Boolean(projectCheck[0]?.archived);

    let archivedAtValue = null;
    if (normalizedArchived) {
      archivedAtValue = formatDateTimeForMySQL(
        archived_at || projectCheck[0]?.archived_at || new Date().toISOString()
      );
    }

    // Update project
    await query(
      'UPDATE projects SET name = ?, description = ?, client = ?, target_date = ?, status = ?, archived = ?, archived_at = ? WHERE id = ?',
      [
        name,
        description || '',
        client || '',
        formattedTargetDate,
        status || 'Planning',
        normalizedArchived ? 1 : 0,
        archivedAtValue,
        id
      ]
    );
    
    let deletedTaskIds = [];
    const updatedTaskIdSet = new Set();

    let existingTasks = [];
    let existingTaskMap = new Map();
    if (Array.isArray(tasks) || explicitDeletedIdSet.size > 0) {
      existingTasks = await query('SELECT * FROM tasks WHERE project_id = ?', [id]);
      existingTaskMap = new Map(existingTasks.map(task => [task.id, task]));
    }

    if (explicitDeletedIdSet.size > 0) {
      const validDeletedIds = existingTasks
        .filter(task => explicitDeletedIdSet.has(task.id))
        .map(task => task.id);

      if (validDeletedIds.length > 0) {
        const placeholders = validDeletedIds.map(() => '?').join(',');
        await query(`DELETE FROM tasks WHERE id IN (${placeholders})`, validDeletedIds);
        deletedTaskIds = deletedTaskIds.concat(validDeletedIds);
        validDeletedIds.forEach(taskId => existingTaskMap.delete(taskId));
        if (validDeletedIds.length > 0) {
          const validDeletedSet = new Set(validDeletedIds);
          existingTasks = existingTasks.filter(task => !validDeletedSet.has(task.id));
        }
      }
    }

    if (Array.isArray(tasks)) {
      const existingTaskIds = existingTasks.map(t => t.id);
      const taskList = isPartialTaskUpdate
        ? tasks.filter(task => !task.id || changedTaskIdSet.has(task.id))
        : tasks;

      if (!isPartialTaskUpdate) {
        const newTaskIds = taskList.map(t => t.id).filter(Boolean);
        const tasksToDelete = existingTaskIds.filter(tid => !newTaskIds.includes(tid));
        if (tasksToDelete.length > 0) {
          const placeholders = tasksToDelete.map(() => '?').join(',');
          await query(`DELETE FROM tasks WHERE id IN (${placeholders})`, tasksToDelete);
          deletedTaskIds = deletedTaskIds.concat(tasksToDelete);
          const tasksToDeleteSet = new Set(tasksToDelete);
          tasksToDelete.forEach(taskId => existingTaskMap.delete(taskId));
          existingTasks = existingTasks.filter(task => !tasksToDeleteSet.has(task.id));
        }
      }

      const needsUuid = taskList.some(task => !task.id);
      let uuidv4;
      if (needsUuid) {
        ({ v4: uuidv4 } = await import('uuid'));
      }

      const normalizeForComparison = (taskRow) => {
        if (!taskRow) return null;
        return {
          name: taskRow.name,
          category: taskRow.category || null,
          status: taskRow.status || 'Not Started',
          notes: taskRow.notes || null,
          completed_at: taskRow.completed_at
            ? (taskRow.completed_at instanceof Date
                ? taskRow.completed_at.toISOString().slice(0, 19).replace('T', ' ')
                : formatDateTimeForMySQL(taskRow.completed_at))
            : null
        };
      };

      for (const task of taskList) {
        let completedAt = null;
        if (task.status === 'Completed') {
          completedAt = task.completed_at
            ? formatDateTimeForMySQL(task.completed_at)
            : new Date().toISOString().slice(0, 19).replace('T', ' ');
        }

        const normalizedIncoming = {
          name: task.name,
          category: task.category || null,
          status: task.status || 'Not Started',
          notes: task.notes || null,
          completed_at: completedAt
        };

        if (task.id && existingTaskMap.has(task.id)) {
          const existingTask = existingTaskMap.get(task.id);
          const existingNormalized = normalizeForComparison(existingTask);

          const needsUpdate = !existingNormalized ||
            existingNormalized.name !== normalizedIncoming.name ||
            existingNormalized.category !== normalizedIncoming.category ||
            existingNormalized.status !== normalizedIncoming.status ||
            existingNormalized.required !== normalizedIncoming.required ||
            existingNormalized.notes !== normalizedIncoming.notes ||
            existingNormalized.completed_at !== normalizedIncoming.completed_at;

          if (needsUpdate) {
            try {
              await query(
                'UPDATE tasks SET name = ?, category = ?, status = ? = ?, notes = ?, completed_at = ?, updated_by_user_id = ?, updated_by_user_name = ?, updated_by_user_image = ? WHERE id = ?',
                [
                  normalizedIncoming.name,
                  normalizedIncoming.category,
                  normalizedIncoming.statusnormalizedIncoming.notes,
                  normalizedIncoming.completed_at,
                  session.user.id,
                  session.user.name || null,
                  session.user.image || null,
                  task.id
                ]
              );
            } catch (dbError) {
              if (dbError.code === 'ER_BAD_FIELD_ERROR') {
                console.log('User tracking columns not available, using basic update');
                await query(
                  'UPDATE tasks SET name = ?, category = ?, status = ? = ?, notes = ?, completed_at = ? WHERE id = ?',
                  [
                    normalizedIncoming.name,
                    normalizedIncoming.category,
                    normalizedIncoming.statusnormalizedIncoming.notes,
                    normalizedIncoming.completed_at,
                    task.id
                  ]
                );
              } else {
                throw dbError;
              }
            }
            updatedTaskIdSet.add(task.id);
          }
        } else {
          const taskId = task.id || (uuidv4 ? uuidv4() : task.id);
          if (!taskId) {
            continue;
          }

          try {
            await query(
              'INSERT INTO tasks (id, project_id, name, category, status, notes, completed_at, updated_by_user_id, updated_by_user_name, updated_by_user_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                taskId,
                id,
                normalizedIncoming.name,
                normalizedIncoming.category,
                normalizedIncoming.statusnormalizedIncoming.notes,
                normalizedIncoming.completed_at,
                session.user.id,
                session.user.name || null,
                session.user.image || null
              ]
            );
          } catch (dbError) {
            if (dbError.code === 'ER_BAD_FIELD_ERROR') {
              console.log('User tracking columns not available, using basic insert');
              await query(
                'INSERT INTO tasks (id, project_id, name, category, status, notes, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  taskId,
                  id,
                  normalizedIncoming.name,
                  normalizedIncoming.category,
                  normalizedIncoming.statusnormalizedIncoming.notes,
                  normalizedIncoming.completed_at
                ]
              );
            } else {
              throw dbError;
            }
          }
          updatedTaskIdSet.add(taskId);
        }
      }
    }

    const projectRows = await query('SELECT * FROM projects WHERE id = ?', [id]);
    const projectRecord = projectRows[0];

    let updatedTasks = [];
    const updatedTaskIds = Array.from(updatedTaskIdSet);
    let responseTaskIds = updatedTaskIds;

    if (isPartialTaskUpdate && changedTaskIdSet.size > 0) {
      const intersection = updatedTaskIds.filter(id => changedTaskIdSet.has(id));
      if (intersection.length > 0) {
        responseTaskIds = intersection;
      }
    }

    if (responseTaskIds.length > 0) {
      const placeholders = responseTaskIds.map(() => '?').join(',');
      const rows = await query(`SELECT * FROM tasks WHERE id IN (${placeholders})`, responseTaskIds);
      const rowMap = new Map(rows.map(row => [row.id, row]));
      updatedTasks = responseTaskIds
        .map(id => rowMap.get(id))
        .filter(Boolean)
        .map(task => ({
          ...task,
          completed_at: task.completed_at ? task.completed_at.toISOString() : null,
          updated_at: task.updated_at ? task.updated_at.toISOString() : null
        }));
    }

    return NextResponse.json({
      project: {
        id: projectRecord.id,
        user_id: projectRecord.user_id,
        name: projectRecord.name,
        description: projectRecord.description,
        client: projectRecord.client,
        target_date: projectRecord.target_date ? projectRecord.target_date.toISOString().split('T')[0] : '',
        status: projectRecord.status,
        archived: Boolean(projectRecord.archived),
        archived_at: projectRecord.archived_at ? projectRecord.archived_at.toISOString() : null,
        updated_at: projectRecord.updated_at ? projectRecord.updated_at.toISOString() : null,
        created_at: projectRecord.created_at ? projectRecord.created_at.toISOString() : null
      },
      updatedTasks,
      deletedTaskIds: Array.from(new Set(deletedTaskIds)),
      fullProject: false
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE - Delete a project
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Await params (Next.js 15 requirement)
    const { id } = await params;
    
    // Verify project ownership
    const projectCheck = await query(
      'SELECT user_id FROM projects WHERE id = ?',
      [id]
    );
    
    if (projectCheck.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    if (projectCheck[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete project (tasks will be deleted via CASCADE)
    await query('DELETE FROM projects WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
