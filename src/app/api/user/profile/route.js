import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

// GET - Get user profile
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await query(
      'SELECT id, email, name, image, created_at, updated_at FROM users WHERE email = ?',
      [session.user.email]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (name.trim().length > 255) {
      return NextResponse.json({ error: 'Name is too long (max 255 characters)' }, { status: 400 });
    }

    // Update user in database
    await query(
      'UPDATE users SET name = ? WHERE email = ?',
      [name.trim(), session.user.email]
    );

    // Fetch and return updated user
    const users = await query(
      'SELECT id, email, name, image, created_at, updated_at FROM users WHERE email = ?',
      [session.user.email]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
