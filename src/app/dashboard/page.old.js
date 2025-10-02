"use client";
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProjectChecklist from '@/components/ProjectChecklist';
import Toast from '@/components/Toast';
import Link from 'next/link';

// Standardized production deployment checklist
const DEPLOYMENT_CHECKLIST = [
  { 
    id: 'env-setup', 
    name: 'Environment Setup', 
    description: 'Configure production environment variables and secrets',
    category: 'Infrastructure',
    required: true
  },
  { 
    id: 'domain-dns', 
    name: 'Domain & DNS Configuration', 
    description: 'Setup custom domain and configure DNS records',
    category: 'Infrastructure',
    required: true
  },
  { 
    id: 'ssl-cert', 
    name: 'SSL Certificate', 
    description: 'Install and configure SSL/TLS certificate',
    category: 'Security',
    required: true
  },
  { 
    id: 'analytics', 
    name: 'Analytics Integration', 
    description: 'Connect Google Analytics, Mixpanel, or similar',
    category: 'Monitoring',
    required: true
  },
  { 
    id: 'error-tracking', 
    name: 'Error Tracking', 
    description: 'Setup Sentry, Rollbar, or similar error monitoring',
    category: 'Monitoring',
    required: true
  },
  { 
    id: 'performance', 
    name: 'Performance Monitoring', 
    description: 'Configure performance monitoring and alerts',
    category: 'Monitoring',
    required: false
  },
  { 
    id: 'db-backup', 
    name: 'Database Backup', 
    description: 'Setup automated database backups',
    category: 'Infrastructure',
    required: true
  },
  { 
    id: 'ci-cd', 
    name: 'CI/CD Pipeline', 
    description: 'Configure automated deployment pipeline',
    category: 'DevOps',
    required: true
  },
  { 
    id: 'security-audit', 
    name: 'Security Audit', 
    description: 'Run security scan and fix vulnerabilities',
    category: 'Security',
    required: true
  },
  { 
    id: 'load-testing', 
    name: 'Load Testing', 
    description: 'Perform load testing and optimize',
    category: 'Testing',
    required: false
  },
  { 
    id: 'seo-meta', 
    name: 'SEO & Meta Tags', 
    description: 'Configure SEO metadata, OpenGraph, Twitter cards',
    category: 'Marketing',
    required: true
  },
  { 
    id: 'legal-docs', 
    name: 'Legal Documents', 
    description: 'Privacy Policy, Terms of Service, Cookie Policy',
    category: 'Legal',
    required: true
  },
  { 
    id: 'cdn-setup', 
    name: 'CDN Configuration', 
    description: 'Setup CDN for static assets',
    category: 'Infrastructure',
    required: false
  },
  { 
    id: 'email-service', 
    name: 'Email Service', 
    description: 'Configure transactional email service (SendGrid, etc)',
    category: 'Infrastructure',
    required: false
  },
  { 
    id: 'staging-test', 
    name: 'Staging Environment Test', 
    description: 'Full testing on staging environment',
    category: 'Testing',
    required: true
  },
  { 
    id: 'prod-deploy', 
    name: 'Production Deployment', 
    description: 'Deploy application to production',
    category: 'Deployment',
    required: true
  },
  { 
    id: 'smoke-test', 
    name: 'Post-Deploy Smoke Test', 
    description: 'Verify critical functionality after deployment',
    category: 'Testing',
    required: true
  },
  { 
    id: 'monitoring-alerts', 
    name: 'Monitoring & Alerts', 
    description: 'Setup uptime monitoring and alert notifications',
    category: 'Monitoring',
    required: true
  }
];

const createProjectTasks = () => {
  return DEPLOYMENT_CHECKLIST.map(task => ({
    id: task.id,
    name: task.name,
    category: task.category,
    status: 'Not Started',
    required: task.required,
    notes: ''
  }));
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [useDefaultTasks, setUseDefaultTasks] = useState(true);
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

  // Load projects from database on mount
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

  const addProject = async (includeDefaults = true) => {
    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const newProject = {
      id: tempId,
      name: `New Project ${projects.length + 1}`,
      description: 'Project description',
      client: 'Client Name',
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Planning',
      tasks: includeDefaults ? createProjectTasks() : []
    };

    // Optimistic update - add to UI immediately
    setProjects([...projects, newProject]);
    setShowNewProjectModal(false);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });

      if (!response.ok) throw new Error('Failed to create project');
      
      // Replace temporary project with real one from server
      const createdProject = await response.json();
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === tempId ? createdProject : p)
      );
    } catch (e) {
      console.error('Error creating project:', e);
      // Remove temporary project on error
      setProjects(prevProjects => prevProjects.filter(p => p.id !== tempId));
      showToast('Failed to create project. Please try again.', 'error');
    }
  };

  const deleteProject = async (projectId) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      // Optimistic update - remove from UI immediately
      const previousProjects = [...projects];
      setProjects(projects.filter(p => p.id !== projectId));

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete project');
      } catch (e) {
        console.error('Error deleting project:', e);
        // Rollback on error
        setProjects(previousProjects);
        showToast('Failed to delete project. It has been restored.', 'error');
      }
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
      
      // Update with server response to ensure consistency
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

  const calculateOverallProgress = () => {
    if (projects.length === 0) return 0;
    const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = projects.reduce((sum, p) => 
      sum + p.tasks.filter(t => t.status === 'Completed').length, 0
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const getProjectsReadyForDeploy = () => {
    return projects.filter(p => {
      const requiredTasks = p.tasks.filter(t => t.required);
      const completedRequired = requiredTasks.filter(t => t.status === 'Completed');
      return requiredTasks.length > 0 && requiredTasks.length === completedRequired.length;
    }).length;
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header - Compact SaaS Style */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Deployment Tracker
                </h1>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/table"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Table View
              </Link>
              
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Project
              </button>

              {/* User Profile Dropdown */}
              {session?.user && (
                <div className="flex items-center gap-2 border-l border-gray-200 pl-3 ml-1">
                  {session.user.image && (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      className="w-8 h-8 rounded-full border border-gray-200"
                    />
                  )}
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{session.user.name}</div>
                    <div className="text-xs text-gray-500">{session.user.email}</div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Sign out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-sm">Error</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 text-sm font-medium">Loading projects...</p>
        </div>
      )}

      {/* Stats Dashboard */}
      {!loading && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Ready to Deploy</p>
                  <p className="text-2xl font-bold text-gray-900">{getProjectsReadyForDeploy()}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Overall Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{calculateOverallProgress()}%</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Checklist Items</p>
                  <p className="text-2xl font-bold text-gray-900">{DEPLOYMENT_CHECKLIST.length}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        {/* Projects List */}
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectChecklist
              key={project.id}
              project={project}
              onUpdate={(updatedProject) => updateProject(project.id, updatedProject)}
              onDelete={() => deleteProject(project.id)}
            />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first project to start tracking deployment progress</p>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create First Project
            </button>
          </div>
        )}
      </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1 text-sm">Include Default Checklist?</h3>
                    <p className="text-xs text-gray-600 mb-3">
                      Choose whether to include {DEPLOYMENT_CHECKLIST.length} pre-configured deployment tasks
                    </p>
                    
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-all border ${
                        useDefaultTasks ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                      }`}>
                        <input
                          type="radio"
                          name="taskOption"
                          checked={useDefaultTasks}
                          onChange={() => setUseDefaultTasks(true)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <div className="font-medium text-gray-900 text-sm">With Default Tasks</div>
                          <div className="text-xs text-gray-500">Start with pre-configured checklist</div>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-all border ${
                        !useDefaultTasks ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                      }`}>
                        <input
                          type="radio"
                          name="taskOption"
                          checked={!useDefaultTasks}
                          onChange={() => setUseDefaultTasks(false)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Empty Project</div>
                          <div className="text-xs text-gray-500">Start from scratch with custom tasks</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => addProject(useDefaultTasks)}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm shadow-sm"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </main>
  );
}
