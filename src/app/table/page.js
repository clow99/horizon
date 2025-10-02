import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getProjects } from '@/lib/server/projects';
import TableClient from '@/components/TableClient';

export default async function TableViewPage() {
  // Check authentication server-side
  const session = await auth();
  
  if (!session) {
    redirect('/');
  }

  // Fetch projects server-side
  const projects = await getProjects();

  // Pass data to client component
  return <TableClient initialProjects={projects} session={session} />;
}
