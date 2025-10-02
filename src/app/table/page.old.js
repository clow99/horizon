"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TableView from '@/components/TableView';
import Toast from '@/components/Toast';

export default function TableViewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const showToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch projects from database
  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (e) {
      console.error('Error loading projects:', e);
      setError('Failed to load projects from database');
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId, updatedProject) => {
    // Optimistic update - update UI immediately
    const previousProjects = [...projects];
    setProjects(prevProjects =>
      prevProjects.map(p => p.id === projectId ? updatedProject : p)
    );

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject)
      });

      if (!response.ok) throw new Error('Failed to update project');
      
      const updated = await response.json();
      setProjects(prevProjects =>
        prevProjects.map(p => p.id === projectId ? updated : p)
      );
    } catch (e) {
      console.error('Error updating project:', e);
      // Rollback on error
      setProjects(previousProjects);
      showToast('Failed to update project. Changes have been reverted.', 'error');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading projects from database...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-xl shadow-lg">
          <p className="font-bold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TableView projects={projects} onUpdateProject={updateProject} />
      
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}

