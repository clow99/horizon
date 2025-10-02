import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectOrder } = await request.json();
    
    if (!Array.isArray(projectOrder)) {
      return NextResponse.json({ error: 'Invalid project order' }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      // Get user_id
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [session.user.email]
      );

      if (users.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userId = users[0].id;

      // Update display_order for each project
      await connection.beginTransaction();

      try {
        for (let i = 0; i < projectOrder.length; i++) {
          const projectId = projectOrder[i];
          
          // Verify this project belongs to the user
          const [projects] = await connection.execute(
            'SELECT id FROM projects WHERE id = ? AND user_id = ?',
            [projectId, userId]
          );

          if (projects.length === 0) {
            throw new Error(`Project ${projectId} not found or unauthorized`);
          }

          // Update display_order
          await connection.execute(
            'UPDATE projects SET display_order = ? WHERE id = ? AND user_id = ?',
            [i, projectId, userId]
          );
        }

        await connection.commit();
        
        return NextResponse.json({ 
          success: true,
          message: 'Project order updated successfully'
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      }

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating project order:', error);
    return NextResponse.json(
      { error: 'Failed to update project order' },
      { status: 500 }
    );
  }
}
