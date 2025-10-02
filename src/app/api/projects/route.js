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
export async function GET() {
  try {
    await ensureTables();
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get projects for this user only
    const projects = await query(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC',
      [session.user.id]
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
        target_date: project.target_date ? project.target_date.toISOString().split('T')[0] : '',
        tasks: tasks.filter(task => task.project_id === project.id).map(task => ({
          ...task,
          required: Boolean(task.required),
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
    const { name, description = '', client = '', target_date = '', status = 'Planning', tasks = [] } = body;
    
    // Format target_date for MySQL (YYYY-MM-DD format)
    let formattedTargetDate = null;
    if (target_date) {
      const date = new Date(target_date);
      formattedTargetDate = date.toISOString().split('T')[0]; // Get just the date part (YYYY-MM-DD)
    }
    
    const projectId = uuidv4();
    
    // Insert project with user_id
    await query(
      'INSERT INTO projects (id, user_id, name, description, client, target_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [projectId, session.user.id, name, description, client, formattedTargetDate, status]
    );
    
    // Insert tasks if provided
    if (tasks.length > 0) {
      for (const task of tasks) {
        const taskId = uuidv4();
        await query(
          'INSERT INTO tasks (id, project_id, name, category, status, required, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [taskId, projectId, task.name, task.category || null, task.status || 'Not Started', task.required || false, task.notes || null]
        );
      }
    }
    
    // Return the created project with tasks
    const newProject = await query('SELECT * FROM projects WHERE id = ?', [projectId]);
    const newTasks = await query('SELECT * FROM tasks WHERE project_id = ?', [projectId]);
    
    return NextResponse.json({
      ...newProject[0],
      target_date: newProject[0].target_date ? newProject[0].target_date.toISOString().split('T')[0] : '',
      tasks: newTasks.map(task => ({
        ...task,
        required: Boolean(task.required),
        completed_at: task.completed_at ? task.completed_at.toISOString() : null
      }))
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
