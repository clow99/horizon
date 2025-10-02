import { auth } from '@/auth';
import { getPool } from '@/lib/db';

/**
 * Server-side function to fetch projects for the current user
 * This runs on the server and can be used in Server Components
 */
export async function getProjects() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return [];
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      // Get user_id from email
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [session.user.email]
      );

      if (users.length === 0) {
        return [];
      }

      const userId = users[0].id;

      // Get all projects for this user
      // Order by display_order if available, otherwise by ID for stable ordering
      const [projects] = await connection.execute(
        `SELECT * FROM projects 
         WHERE user_id = ? 
         ORDER BY 
           CASE WHEN display_order IS NOT NULL THEN display_order ELSE id END ASC,
           id ASC`,
        [userId]
      );

      // Get tasks for each project
      const projectsWithTasks = await Promise.all(
        projects.map(async (project) => {
          // Order tasks by ID for stable ordering
          const [tasks] = await connection.execute(
            'SELECT * FROM tasks WHERE project_id = ? ORDER BY id ASC',
            [project.id]
          );

          return {
            ...project,
            tasks: tasks
          };
        })
      );

      return projectsWithTasks;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}
