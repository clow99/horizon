"use client";
import { useState, useRef, useCallback } from 'react';
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

  // Track in-flight updates per project to prevent concurrent updates to same project
  const projectUpdates = useRef(new Map());

  const updateProject = useCallback(async (projectId, updatedProjectOrFunction) => {
    console.log('TableClient.updateProject called:', { projectId, updatedProjectOrFunction: typeof updatedProjectOrFunction });
    
    // ALWAYS do optimistic update IMMEDIATELY (before waiting for any pending updates)
    // This makes the UI feel instant
    let updatedProject;
    
    if (typeof updatedProjectOrFunction === 'function') {
      // Use functional update with latest state
      setProjects(prevProjects => {
        const currentProject = prevProjects.find(p => p.id === projectId);
        if (!currentProject) {
          console.error('Project not found:', projectId);
          return prevProjects;
        }
        
        updatedProject = updatedProjectOrFunction(currentProject);
        console.log('Functional update created:', updatedProject);
        return prevProjects.map(p => p.id === projectId ? updatedProject : p);
      });
    } else {
      // Direct object update
      updatedProject = updatedProjectOrFunction;
      console.log('Direct object update - applying optimistically:', updatedProject);
      
      // Optimistic UI update (IMMEDIATE)
      setProjects(prevProjects =>
        prevProjects.map(p => p.id === projectId ? updatedProject : p)
      );
    }

    if (!updatedProject) {
      console.error('Failed to create updatedProject, aborting');
      return;
    }

    // NOW queue the API call (if another is in progress)
    if (projectUpdates.current.has(projectId)) {
      console.log('Project update already in progress, queuing API call:', projectId);
      try {
        await projectUpdates.current.get(projectId);
        console.log('Previous update completed, proceeding with queued API call');
      } catch (e) {
        console.log('Previous update failed, proceeding anyway');
      }
    }

    // Create a promise for this update
    const updatePromise = (async () => {
      try {
        console.log('Making API call to:', `/api/projects/${projectId}`);
        console.log('Sending project data:', JSON.stringify(updatedProject, null, 2));
        
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProject)
        });

        console.log('API response status:', response.status);
        console.log('API response headers:', response.headers);
        console.log('API response content-type:', response.headers.get('content-type'));
        
        // Clone the response so we can read it multiple times if needed
        const responseClone = response.clone();
        
        if (!response.ok) {
          let errorText = 'Unknown error';
          try {
            errorText = await response.text();
          } catch (e) {
            console.error('Could not read error response:', e);
          }
          console.error('API error response:', errorText);
          throw new Error(`Failed to update project: ${response.status} - ${errorText}`);
        }
        
        let updated;
        try {
          const textResponse = await responseClone.text();
          console.log('Raw response body:', textResponse.substring(0, 200)); // Log first 200 chars
          updated = JSON.parse(textResponse);
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          try {
            const responseText = await response.text();
            console.error('Full response body:', responseText);
          } catch (e2) {
            console.error('Could not read response as text either:', e2);
          }
          throw new Error('Server returned invalid JSON');
        }
        console.log('API response data:', updated);
        
        // Don't update state with server response - the optimistic update is sufficient
        // This prevents page state changes/reordering when checkboxes are clicked
        // Only rollback on error (handled in catch block)
      } catch (e) {
        console.error('=== ERROR IN UPDATE PROJECT ===');
        console.error('Error type:', e.constructor.name);
        console.error('Error message:', e.message);
        console.error('Error stack:', e.stack);
        console.error('Project ID:', projectId);
        console.error('Updated project that was being sent:', updatedProject);
        console.error('================================');
        // On error, revert to the last known good state from the server
        showToast('Failed to update project. Please refresh the page.', 'error');
      } finally {
        // Remove from in-flight updates
        projectUpdates.current.delete(projectId);
      }
    })();

    // Track this update
    projectUpdates.current.set(projectId, updatePromise);

    return updatePromise;
  }, []);

  const reorderProjects = useCallback((newProjects) => {
    console.log('TableClient.reorderProjects called:', newProjects);
    // Update state with new order
    setProjects(newProjects);
    
    // Save the new order to the server
    const projectIds = newProjects.map(p => p.id);
    saveProjectOrder(projectIds);
  }, []);

  const saveProjectOrder = useCallback(async (projectIds) => {
    try {
      const response = await fetch('/api/projects/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectOrder: projectIds })
      });

      if (!response.ok) {
        throw new Error('Failed to save project order');
      }
      
      console.log('Project order saved successfully');
    } catch (error) {
      console.error('Error saving project order:', error);
      showToast('Failed to save project order. Changes may not persist.', 'error');
    }
  }, []);

  return (
    <>
      <TableView 
        projects={projects} 
        onUpdateProject={updateProject} 
        onReorderProjects={reorderProjects}
        session={session} 
      />
      
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
