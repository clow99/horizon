"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TableView from '@/components/TableView';
import Toast from '@/components/Toast';

export default function TableClient({ initialProjects, session }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const showToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
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
      
      // Don't refresh to avoid re-sorting the table
      // router.refresh();
    } catch (e) {
      console.error('Error updating project:', e);
      // Rollback on error
      setProjects(previousProjects);
      showToast('Failed to update project. Changes have been reverted.', 'error');
    }
  };

  return (
    <>
      <TableView projects={projects} onUpdateProject={updateProject} session={session} />
      
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
