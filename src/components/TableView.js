"use client";
import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

const statusOptions = [
  { value: 'Not Started', label: 'Not Started', color: 'gray' },
  { value: 'In Progress', label: 'In Progress', color: 'blue' },
  { value: 'Completed', label: 'Completed', color: 'green' },
  { value: 'Blocked', label: 'Blocked', color: 'red' }
];

export default function TableView({ projects: initialProjects, onUpdateProject, session }) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [groupBy, setGroupBy] = useState('task'); // 'task' or 'category'
  const [updatingTasks, setUpdatingTasks] = useState(new Set()); // Track which tasks are updating
  const [draggedProjectId, setDraggedProjectId] = useState(null);
  const [dragOverProjectId, setDragOverProjectId] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const projectRefs = useRef({});
  
  // Pagination state - Load from localStorage or default to 4
  const [currentPage, setCurrentPage] = useState(0);
  const [projectsPerPage, setProjectsPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tableView_projectsPerPage');
      return saved ? parseInt(saved, 10) : 4;
    }
    return 4;
  });

  // Save projectsPerPage to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tableView_projectsPerPage', projectsPerPage.toString());
    }
  }, [projectsPerPage]);

  // Sync projects when initialProjects changes (from parent updates)
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Calculate pagination
  const totalPages = Math.ceil(projects.length / projectsPerPage);
  const startIndex = currentPage * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const paginatedProjects = projects.slice(startIndex, endIndex);

  // Reset to first page if current page is out of bounds
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  // Get all unique task names across all projects
  const allUniqueTaskNames = useMemo(() => {
    const taskMap = new Map();
    
    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (!taskMap.has(task.name)) {
          taskMap.set(task.name, {
            name: task.name,
            description: task.description,
            category: task.category,
            required: task.required
          });
        }
      });
    });
    
    return Array.from(taskMap.values());
  }, [projects]);

  // Get all unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    projects.forEach(project => {
      project.tasks.forEach(task => cats.add(task.category));
    });
    return ['all', ...Array.from(cats)];
  }, [projects]);

  // Filter tasks by category
  const filteredTasks = selectedCategory === 'all' 
    ? allUniqueTaskNames 
    : allUniqueTaskNames.filter(t => t.category === selectedCategory);

  // Group tasks by category if needed
  const groupedTasks = useMemo(() => {
    if (groupBy === 'task') {
      return [{ category: 'All Tasks', tasks: filteredTasks }];
    }
    
    const groups = {};
    filteredTasks.forEach(task => {
      if (!groups[task.category]) {
        groups[task.category] = [];
      }
      groups[task.category].push(task);
    });
    
    return Object.entries(groups).map(([category, tasks]) => ({
      category,
      tasks
    }));
  }, [filteredTasks, groupBy]);

  // Find task in project
  const findTaskInProject = (project, taskName) => {
    return project.tasks.find(t => t.name === taskName);
  };

  // Update task in project
  const updateTaskInProject = (projectId, taskName, updates) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Create unique key for this task update
    const taskKey = `${projectId}-${taskName}`;
    
    // Add to updating set for visual feedback
    setUpdatingTasks(prev => new Set([...prev, taskKey]));

    const updatedTasks = project.tasks.map(task =>
      task.name === taskName ? { ...task, ...updates } : task
    );

    const updatedProject = { ...project, tasks: updatedTasks };

    // Update local state immediately for responsive UI
    setProjects(prevProjects =>
      prevProjects.map(p => p.id === projectId ? updatedProject : p)
    );

    // Call parent update (optimistic update happens in parent too)
    onUpdateProject(projectId, updatedProject);
    
    // Remove from updating set after a short delay (optimistic - assume success)
    setTimeout(() => {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskKey);
        return newSet;
      });
    }, 300);
  };

  // Add missing task to a project
  const addMissingTask = async (projectId, taskTemplate) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const taskKey = `${projectId}-${taskTemplate.name}`;
    setUpdatingTasks(prev => new Set([...prev, taskKey]));

    // Create new task with default values
    const newTask = {
      name: taskTemplate.name,
      description: taskTemplate.description,
      category: taskTemplate.category,
      required: taskTemplate.required,
      status: 'Not Started',
      notes: '',
      targetDate: null,
      completedDate: null
    };

    const updatedTasks = [...project.tasks, newTask];
    const updatedProject = { ...project, tasks: updatedTasks };

    // Update local state immediately
    setProjects(prevProjects =>
      prevProjects.map(p => p.id === projectId ? updatedProject : p)
    );

    // Call parent update
    onUpdateProject(projectId, updatedProject);

    // Remove from updating set
    setTimeout(() => {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskKey);
        return newSet;
      });
    }, 300);
  };

  // Drag and drop handlers for reordering projects
  const handleDragStart = (e, projectId) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e, projectId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (projectId && projectId !== draggedProjectId) {
      setDragOverProjectId(projectId);
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the drop zone completely
    if (e.currentTarget === e.target) {
      setDragOverProjectId(null);
    }
  };

  const handleDrop = async (e, targetProjectId) => {
    e.preventDefault();
    setDragOverProjectId(null);
    
    if (draggedProjectId === targetProjectId) {
      setDraggedProjectId(null);
      return;
    }

    const draggedIndex = projects.findIndex(p => p.id === draggedProjectId);
    const targetIndex = projects.findIndex(p => p.id === targetProjectId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedProjectId(null);
      return;
    }

    // Capture positions before reorder (FLIP: First)
    const beforePositions = {};
    projects.forEach(project => {
      const el = projectRefs.current[project.id];
      if (el) {
        const rect = el.getBoundingClientRect();
        beforePositions[project.id] = { left: rect.left, top: rect.top };
      }
    });

    // Reorder projects array
    const newProjects = [...projects];
    const [removed] = newProjects.splice(draggedIndex, 1);
    newProjects.splice(targetIndex, 0, removed);

    setProjects(newProjects);
    setIsReordering(true);

    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      // Capture positions after reorder (FLIP: Last)
      newProjects.forEach(project => {
        const el = projectRefs.current[project.id];
        if (el && beforePositions[project.id]) {
          const rect = el.getBoundingClientRect();
          const deltaX = beforePositions[project.id].left - rect.left;
          const deltaY = beforePositions[project.id].top - rect.top;

          // Invert: Apply transform to make it look like it's still in the old position
          if (deltaX !== 0 || deltaY !== 0) {
            el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            el.style.transition = 'none';

            // Play: Animate to new position
            requestAnimationFrame(() => {
              el.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
              el.style.transform = 'translate(0, 0)';
            });
          }
        }
      });

      // Clean up after animation
      setTimeout(() => {
        newProjects.forEach(project => {
          const el = projectRefs.current[project.id];
          if (el) {
            el.style.transition = '';
            el.style.transform = '';
          }
        });
        setIsReordering(false);
        setDraggedProjectId(null);
      }, 300);
    });

    // Save the new order to the server
    await saveProjectOrder(newProjects.map(p => p.id));
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
    setDragOverProjectId(null);
  };

  const saveProjectOrder = async (projectIds) => {
    setIsSavingOrder(true);
    try {
      const response = await fetch('/api/projects/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectOrder: projectIds })
      });

      if (!response.ok) {
        throw new Error('Failed to save project order');
      }
    } catch (error) {
      console.error('Error saving project order:', error);
      // Optionally show toast notification
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Calculate completion stats for a task across all projects
  const getTaskStats = (taskName) => {
    let total = 0;
    let completed = 0;
    
    projects.forEach(project => {
      const task = findTaskInProject(project, taskName);
      if (task) {
        total++;
        if (task.status === 'Completed') completed++;
      }
    });
    
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  // Calculate overall stats
  const overallStats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    
    projects.forEach(project => {
      project.tasks.forEach(task => {
        totalTasks++;
        if (task.status === 'Completed') completedTasks++;
      });
    });
    
    return {
      total: totalTasks,
      completed: completedTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  }, [projects]);

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-md">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Available</h3>
          <p className="text-gray-600 mb-6">Create some projects first to use the table view</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Consistent Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Production Deployment Tracker</h1>
              <nav className="flex gap-1">
                <Link 
                  href="/dashboard" 
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/table" 
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md"
                >
                  Table View
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {session?.user && (
                <div className="flex items-center gap-2">
                  {session.user.image && (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name} 
                      className="w-8 h-8 rounded-full border-2 border-gray-200"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">{session.user.name}</span>
                </div>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters and Controls */}
      <div className="mx-auto px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{projects.length}</div>
                <div className="text-xs text-gray-600">Projects</div>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{overallStats.percentage}%</div>
                <div className="text-xs text-gray-600">Complete</div>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-xl font-bold text-indigo-600">{overallStats.completed}/{overallStats.total}</div>
                <div className="text-xs text-gray-600">Tasks</div>
              </div>
            </div>
            
            {/* Saving indicator */}
            {isSavingOrder && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving order...
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-3">
            {/* Projects per page selector */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
              <span className="text-xs font-medium text-gray-600">Show:</span>
              <select
                value={projectsPerPage}
                onChange={(e) => {
                  setProjectsPerPage(Number(e.target.value));
                  setCurrentPage(0); // Reset to first page
                }}
                className="text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2" className="text-gray-900">2</option>
                <option value="3" className="text-gray-900">3</option>
                <option value="4" className="text-gray-900">4</option>
                <option value="6" className="text-gray-900">6</option>
                <option value="8" className="text-gray-900">8</option>
                <option value={projects.length} className="text-gray-900">All</option>
              </select>
              <span className="text-xs text-gray-600">projects</span>
            </div>

            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1 border border-gray-200">
                  <span className="text-xs font-medium text-gray-700">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({startIndex + 1}-{Math.min(endIndex, projects.length)} of {projects.length})
                  </span>
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Group By Toggle */}
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setGroupBy('task')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                groupBy === 'task'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              By Task
            </button>
            <button
              onClick={() => setGroupBy('category')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                groupBy === 'category'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              By Category
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map(category => {
              const count = category === 'all' 
                ? allUniqueTaskNames.length 
                : allUniqueTaskNames.filter(t => t.category === category).length;
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {category === 'all' ? 'All' : category} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="mx-auto p-4">
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 overflow-hidden">
          {groupedTasks.map((group, groupIdx) => (
            <div key={group.category}>
              {groupBy === 'category' && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 border-b-2 border-indigo-700">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {group.category}
                  </h2>
                </div>
              )}
              
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full border-collapse">
                  <thead>
                    {/* Project Headers - More Prominent */}
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-900 border-b-4 border-slate-600">
                      <th className="px-4 py-3 text-left text-xs font-bold text-white border-b-2 border-slate-700 w-96 sticky left-0 bg-slate-800 z-30">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Task Details
                        </div>
                      </th>
                      {paginatedProjects.map((project, idx) => {
                        const globalIdx = startIndex + idx; // Calculate global index
                        const isDragging = draggedProjectId === project.id;
                        const isDragOver = dragOverProjectId === project.id;
                        return (
                        <th 
                          key={project.id}
                          ref={(el) => projectRefs.current[project.id] = el}
                          className={`px-3 py-3 text-center border-b-2 border-slate-700 min-w-[200px] max-w-[200px] cursor-move transition-all ${
                            isReordering ? 'duration-300 ease-out' : 'duration-200'
                          } ${
                            isDragging 
                              ? 'opacity-40 scale-95' 
                              : isDragOver 
                              ? 'scale-105 bg-slate-700 shadow-2xl ring-4 ring-blue-400 ring-opacity-50' 
                              : 'hover:bg-slate-750'
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, project.id)}
                          onDragOver={(e) => handleDragOver(e, project.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, project.id)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            {/* Drag Handle Icon */}
                            <div className={`transition-all cursor-move mb-1 p-1 rounded ${
                              isDragging 
                                ? 'bg-blue-500 text-white scale-110' 
                                : isDragOver 
                                ? 'bg-blue-400 text-white scale-110 animate-pulse' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-600'
                            }`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                            {/* Project Number Badge */}
                            <div className={`w-8 h-8 rounded-full bg-white text-slate-900 font-bold text-base flex items-center justify-center shadow-lg transition-all ${
                              isDragging ? 'scale-90' : isDragOver ? 'scale-110 ring-4 ring-blue-400' : ''
                            }`}>
                              {globalIdx + 1}
                            </div>
                            {/* Project Name */}
                            <div className="text-white font-bold text-xs leading-tight px-2 text-center line-clamp-2" title={project.name}>
                              {project.name}
                            </div>
                            {/* Project URL */}
                            <div className="text-slate-300 text-xs truncate max-w-full px-2" title={project.url}>
                              {project.url}
                            </div>
                            {/* Project Progress */}
                            <div className="w-full px-2">
                              <div className="bg-slate-700 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-1.5 rounded-full transition-all"
                                  style={{ 
                                    width: `${project.tasks.length > 0 
                                      ? (project.tasks.filter(t => t.status === 'Completed').length / project.tasks.length) * 100 
                                      : 0}%` 
                                  }}
                                />
                              </div>
                              <div className="text-xs text-slate-300 mt-0.5">
                                {project.tasks.filter(t => t.status === 'Completed').length}/{project.tasks.length} tasks
                              </div>
                            </div>
                          </div>
                        </th>
                      );
                      })}
                      <th className="px-3 py-3 text-center border-b-2 border-slate-700 w-32 sticky right-0 bg-slate-800 z-30">
                        <div className="text-white font-bold text-xs">
                          <div className="flex items-center justify-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Progress
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {group.tasks.map((taskTemplate, idx) => {
                      const stats = getTaskStats(taskTemplate.name);
                      const isEvenRow = idx % 2 === 0;
                      
                      return (
                        <tr key={`${taskTemplate.name}-${idx}`} className={`${isEvenRow ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                          <td className={`px-4 py-3 border-r-2 border-gray-300 sticky left-0 ${isEvenRow ? 'bg-white' : 'bg-gray-50'} z-20 hover:bg-blue-50`}>
                            <div className="flex items-start gap-2">
                              {/* Task Number */}
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border-2 border-slate-300">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900 mb-0.5 flex items-center gap-1.5 text-sm">
                                  {taskTemplate.name}
                                </div>
                                <p className="text-xs text-gray-600 mb-1.5 leading-snug">{taskTemplate.description}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-300">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    {taskTemplate.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          {paginatedProjects.map((project, projectIdx) => {
                            const task = findTaskInProject(project, taskTemplate.name);
                            const taskKey = `${project.id}-${taskTemplate.name}`;
                            const isUpdating = updatingTasks.has(taskKey);
                            
                            if (!task) {
                              return (
                                <td key={project.id} className="px-3 py-3 text-center border-r border-gray-200">
                                  <button
                                    onClick={() => addMissingTask(project.id, taskTemplate)}
                                    disabled={isUpdating}
                                    className={`px-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded transition-all ${
                                      isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Add this task to the project"
                                  >
                                    {isUpdating ? 'adding...' : 'add task +'}
                                  </button>
                                </td>
                              );
                            }
                            
                            return (
                              <td key={project.id} className="px-3 py-3 border-r border-gray-200">
                                <div className="flex flex-col items-center gap-2">
                                  {/* Completion Status Card */}
                                  <div className={`w-full rounded-lg border-2 p-2 transition-all relative ${
                                    task.status === 'Completed'
                                      ? 'bg-green-50 border-green-400 shadow-sm'
                                      : 'bg-white border-gray-300 hover:border-gray-400'
                                  } ${isUpdating ? 'opacity-60' : ''}`}>
                                    {/* Checkbox with Label */}
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                      <div className="relative flex items-center justify-center w-5 h-5">
                                        <input
                                          type="checkbox"
                                          checked={task.status === 'Completed'}
                                          onChange={(e) => updateTaskInProject(project.id, task.name, {
                                            status: e.target.checked ? 'Completed' : 'Not Started'
                                          })}
                                          disabled={isUpdating}
                                          className="w-5 h-5 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer border-2 border-gray-400 disabled:cursor-not-allowed accent-blue-600"
                                        />
                                        {isUpdating && (
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                          </div>
                                        )}
                                      </div>
                                      <span className={`text-xs font-semibold ${
                                        task.status === 'Completed' ? 'text-green-700' : 'text-gray-700'
                                      }`}>
                                        {isUpdating ? 'Updating...' : task.status === 'Completed' ? 'Completed' : 'Mark Complete'}
                                      </span>
                                    </label>
                                  </div>

                                  {/* Status Selector */}
                                  <div className="w-full">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1 text-left">
                                      Status
                                    </label>
                                    <select
                                      value={task.status}
                                      onChange={(e) => updateTaskInProject(project.id, task.name, {
                                        status: e.target.value
                                      })}
                                      disabled={isUpdating}
                                      className={`w-full px-2.5 py-1.5 rounded-lg border-2 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed ${
                                        task.status === 'Completed'
                                          ? 'bg-green-100 border-green-400 text-green-800 focus:ring-green-500'
                                          : task.status === 'In Progress'
                                          ? 'bg-blue-100 border-blue-400 text-blue-800 focus:ring-blue-500'
                                          : task.status === 'Blocked'
                                          ? 'bg-indigo-100 border-indigo-400 text-indigo-800 focus:ring-indigo-500'
                                          : 'bg-gray-100 border-gray-400 text-gray-800 focus:ring-gray-500'
                                      }`}
                                    >
                                      {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                          
                          <td className={`px-3 py-3 text-center border-l-2 border-gray-300 sticky right-0 ${isEvenRow ? 'bg-white' : 'bg-gray-50'} z-20 hover:bg-blue-50`}>
                            <div className="flex flex-col items-center gap-1.5">
                              <div className={`text-2xl font-bold ${
                                stats.percentage === 100 ? 'text-green-600' :
                                stats.percentage >= 50 ? 'text-blue-600' :
                                stats.percentage > 0 ? 'text-yellow-600' :
                                'text-gray-400'
                              }`}>
                                {Math.round(stats.percentage)}%
                              </div>
                              <div className="text-xs font-semibold text-gray-600">
                                {stats.completed} of {stats.total}
                              </div>
                              <div className="w-20 bg-gray-200 rounded-full h-2.5 mt-0.5 overflow-hidden border border-gray-300">
                                <div
                                  className={`h-2.5 rounded-full transition-all ${
                                    stats.percentage === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                    stats.percentage >= 50 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                                    stats.percentage > 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                                    'bg-gray-300'
                                  }`}
                                  style={{ width: `${stats.percentage}%` }}
                                />
                              </div>
                              {stats.percentage === 100 && (
                                <div className="mt-0.5">
                                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
