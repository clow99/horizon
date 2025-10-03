import { NextResponse } from 'next/server';
import { query, initializeTables } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/auth';

// Ensure tables exist
let tablesInitialized = false;
async function ensureTables() {
  if (!tablesInitialized) {
    await initializeTables();
    tablesInitialized = true;
  }
}

// GET all projects with their tasks (filtered by user)
export async function GET(request) {
  try {
    await ensureTables();
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = request ? new URL(request.url) : null;
    const archivedParam = url?.searchParams.get('archived');
    const includeArchived = archivedParam === 'include';
    const archivedOnly = archivedParam === 'only';

    let whereClause = 'user_id = ?';
    const params = [session.user.id];

    if (archivedOnly) {
      whereClause += ' AND archived = 1';
    } else if (!includeArchived) {
      whereClause += ' AND (archived IS NULL OR archived = 0)';
    }

    // Get projects for this user only
    const projects = await query(
      `SELECT * FROM projects WHERE ${whereClause} ORDER BY archived ASC, created_at DESC`,
      params
    );
    
    // Get all tasks for these projects
    if (projects.length > 0) {
      const projectIds = projects.map(p => p.id);
      const placeholders = projectIds.map(() => '?').join(',');
      const tasks = await query(
        `SELECT * FROM tasks WHERE project_id IN (${placeholders}) ORDER BY created_at`,
        projectIds
      );
      
      // Group tasks by project
      const projectsWithTasks = projects.map(project => ({
        ...project,
        archived: Boolean(project.archived),
        archived_at: project.archived_at ? project.archived_at.toISOString() : null,
        target_date: project.target_date ? project.target_date.toISOString().split('T')[0] : '',
        tasks: tasks.filter(task => task.project_id === project.id).map(task => ({
          ...task,
          completed_at: task.completed_at ? task.completed_at.toISOString() : null
        }))
      }));
      
      return NextResponse.json(projectsWithTasks);
    }
    
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST - Create a new project
export async function POST(request) {
  try {
    await ensureTables();
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, description = '', client = '', target_date = '', status = 'Planning', project_type = null, tasks = [] } = body;
    
    // Format target_date for MySQL (YYYY-MM-DD format)
    let formattedTargetDate = null;
    if (target_date) {
      const date = new Date(target_date);
      formattedTargetDate = date.toISOString().split('T')[0]; // Get just the date part (YYYY-MM-DD)
    }
    
    const projectId = uuidv4();
    
    // Insert project with user_id and project_type
    await query(
      'INSERT INTO projects (id, user_id, name, description, client, target_date, status, project_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, session.user.id, name, description, client, formattedTargetDate, status, project_type]
    );
    
    // Insert tasks if provided
    if (tasks.length > 0) {
      for (const task of tasks) {
        const taskId = uuidv4();
        await query(
          'INSERT INTO tasks (id, project_id, name, category, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [taskId, projectId, task.name, task.category || null, task.status || 'Not Started', task.notes || null]
        );
      }
    }
    
    // Return the created project with tasks
    const newProject = await query('SELECT * FROM projects WHERE id = ?', [projectId]);
    const newTasks = await query('SELECT * FROM tasks WHERE project_id = ?', [projectId]);
    
    return NextResponse.json({
      ...newProject[0],
      archived: Boolean(newProject[0]?.archived),
      archived_at: newProject[0]?.archived_at ? newProject[0].archived_at.toISOString() : null,
      target_date: newProject[0].target_date ? newProject[0].target_date.toISOString().split('T')[0] : '',
      tasks: newTasks.map(task => ({
        ...task,
        completed_at: task.completed_at ? task.completed_at.toISOString() : null
      }))
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
