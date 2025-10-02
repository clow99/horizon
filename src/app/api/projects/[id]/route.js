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
      'SELECT user_id FROM projects WHERE id = ?',
      [id]
    );
    
    if (projectCheck.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    if (projectCheck[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { name, description, client, target_date, status, tasks } = body;
    
    // Format target_date for MySQL (YYYY-MM-DD format)
    let formattedTargetDate = null;
    if (target_date) {
      const date = new Date(target_date);
      formattedTargetDate = date.toISOString().split('T')[0]; // Get just the date part (YYYY-MM-DD)
    }
    
    // Update project
    await query(
      'UPDATE projects SET name = ?, description = ?, client = ?, target_date = ?, status = ? WHERE id = ?',
      [name, description || '', client || '', formattedTargetDate, status || 'Planning', id]
    );
    
    // Update tasks if provided
    if (tasks) {
      // Get existing task IDs
      const existingTasks = await query('SELECT id FROM tasks WHERE project_id = ?', [id]);
      const existingTaskIds = existingTasks.map(t => t.id);
      const newTaskIds = tasks.map(t => t.id).filter(Boolean);
      
      // Delete tasks that are no longer in the list
      const tasksToDelete = existingTaskIds.filter(tid => !newTaskIds.includes(tid));
      if (tasksToDelete.length > 0) {
        const placeholders = tasksToDelete.map(() => '?').join(',');
        await query(`DELETE FROM tasks WHERE id IN (${placeholders})`, tasksToDelete);
      }
      
      // Update or insert tasks
      for (const task of tasks) {
        // Format completed_at for MySQL (YYYY-MM-DD HH:MM:SS)
        let completedAt = null;
        if (task.status === 'Completed') {
          if (task.completed_at) {
            const date = new Date(task.completed_at);
            completedAt = date.toISOString().slice(0, 19).replace('T', ' ');
          } else {
            const now = new Date();
            completedAt = now.toISOString().slice(0, 19).replace('T', ' ');
          }
        }

        if (task.id && existingTaskIds.includes(task.id)) {
          // Update existing task
          await query(
            'UPDATE tasks SET name = ?, category = ?, status = ?, required = ?, notes = ?, completed_at = ? WHERE id = ?',
            [
              task.name,
              task.category || null,
              task.status || 'Not Started',
              task.required || false,
              task.notes || null,
              completedAt,
              task.id
            ]
          );
        } else {
          // Insert new task
          const { v4: uuidv4 } = await import('uuid');
          const taskId = task.id || uuidv4();
          await query(
            'INSERT INTO tasks (id, project_id, name, category, status, required, notes, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              taskId,
              id,
              task.name,
              task.category || null,
              task.status || 'Not Started',
              task.required || false,
              task.notes || null,
              completedAt
            ]
          );
        }
      }
    }
    
    // Return updated project with tasks
    const updatedProject = await query('SELECT * FROM projects WHERE id = ?', [id]);
    const updatedTasks = await query('SELECT * FROM tasks WHERE project_id = ?', [id]);
    
    return NextResponse.json({
      ...updatedProject[0],
      target_date: updatedProject[0].target_date ? updatedProject[0].target_date.toISOString().split('T')[0] : '',
      tasks: updatedTasks.map(task => ({
        ...task,
        required: Boolean(task.required),
        completed_at: task.completed_at ? task.completed_at.toISOString() : null
      }))
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
