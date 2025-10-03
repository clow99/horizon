import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  // Check authentication server-side
  const session = await auth();
  
  if (!session) {
    redirect('/');
  }

  // Fetch user details from database
  const users = await query(
    'SELECT id, email, name, image, created_at FROM users WHERE email = ?',
    [session.user.email]
  );

  const user = users[0] || null;

  if (!user) {
    redirect('/');
  }

  // Pass data to client component
  return <ProfileClient user={user} />;
}
