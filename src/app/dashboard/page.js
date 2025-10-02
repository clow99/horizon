import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getProjects } from '@/lib/server/projects';
import DashboardClient from '@/components/DashboardClient';

export default async function DashboardPage() {
  // Check authentication server-side
  const session = await auth();
  
  if (!session) {
    redirect('/');
  }

  // Fetch projects server-side
  const projects = await getProjects();

  // Pass data to client component
  return <DashboardClient initialProjects={projects} session={session} />;
}
