import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';

function formatDateTimeForMySQL(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function formatTaskRow(task) {
  if (!task) return null;
  return {
    ...task,
    completed_at: task.completed_at ? task.completed_at.toISOString() : null,
    updated_at: task.updated_at ? task.updated_at.toISOString() : null,
  };
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, taskId } = await params;

    const projectRows = await query('SELECT user_id FROM projects WHERE id = ?', [projectId]);
    if (projectRows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (projectRows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingTasks = await query('SELECT * FROM tasks WHERE id = ? AND project_id = ?', [taskId, projectId]);
    if (existingTasks.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, completed_at: completedAtInput, notes } = body || {};

    if (!status && typeof notes !== 'string') {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    let completedAt = null;
    if (status === 'Completed') {
      completedAt = formatDateTimeForMySQL(completedAtInput || new Date().toISOString());
    } else if (status) {
      completedAt = formatDateTimeForMySQL(null);
    }

    const fields = [];
    const values = [];

    if (status) {
      fields.push('status = ?');
      values.push(status);
    }

    if (status) {
      fields.push('completed_at = ?');
      values.push(completedAt);
    }

    if (typeof notes === 'string') {
      fields.push('notes = ?');
      values.push(notes || null);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const trackingFields = ['updated_by_user_id = ?', 'updated_by_user_name = ?', 'updated_by_user_image = ?'];
    const trackingValues = [session.user.id, session.user.name || null, session.user.image || null];

    let updateSucceeded = false;
    try {
      await query(
        `UPDATE tasks SET ${fields.concat(trackingFields).join(', ')} WHERE id = ? AND project_id = ?`,
        [...values, ...trackingValues, taskId, projectId]
      );
      updateSucceeded = true;
    } catch (dbError) {
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        await query(
          `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND project_id = ?`,
          [...values, taskId, projectId]
        );
        updateSucceeded = true;
      } else {
        throw dbError;
      }
    }

    if (!updateSucceeded) {
      throw new Error('Failed to update task');
    }

    const updatedRows = await query('SELECT * FROM tasks WHERE id = ? AND project_id = ?', [taskId, projectId]);
    const formattedTask = formatTaskRow(updatedRows[0]);

    return NextResponse.json({
      updatedTasks: formattedTask ? [formattedTask] : [],
      deletedTaskIds: [],
      project: null,
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json({ error: 'Failed to update task status' }, { status: 500 });
  }
}
