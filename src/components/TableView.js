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

export default function TableView({ projects, onUpdateProject, onReorderProjects, session }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [groupBy, setGroupBy] = useState('task'); // 'task' or 'category'
  const [updatingTasks, setUpdatingTasks] = useState(new Set()); // Track which tasks are updating
  const [draggedProjectId, setDraggedProjectId] = useState(null);
  const [dragOverProjectId, setDragOverProjectId] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasManualOrder, setHasManualOrder] = useState(false); // Track if user has manually reordered
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); // Track which task is being confirmed for deletion: { projectId, taskName }
  const [isDeletingTask, setIsDeletingTask] = useState(false); // Prevent multiple simultaneous deletions
  const [addingTasks, setAddingTasks] = useState(new Set()); // Track which tasks are currently being added
  const projectRefs = useRef({});
  const updateQueueRef = useRef(Promise.resolve()); // Queue for local updates
  
  // Pagination state - Always default to "All" projects
  const [currentPage, setCurrentPage] = useState(0);
  const [projectsPerPage, setProjectsPerPage] = useState(projects.length || 999);
  const [isClient, setIsClient] = useState(false);

  // Set isClient flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update projectsPerPage when projects changes (for "All" option)
  useEffect(() => {
    if (projectsPerPage === projects.length || projectsPerPage >= 999) {
      // If user had "All" selected, keep it as "All" with new count
      setProjectsPerPage(projects.length || 999);
    }
  }, [projects.length]);

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

  // Get all unique task names across all projects, maintaining STABLE order
  // Task order should NOT change when projects are reordered
  const allUniqueTaskNames = useMemo(() => {
    const taskMap = new Map();
    
    // Collect all unique tasks from all projects
    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (!taskMap.has(task.name)) {
          taskMap.set(task.name, {
            name: task.name,
            description: task.description,
            category: task.category,
            required: task.required,
            // Use the task's database ID for stable sorting if available
            id: task.id
          });
        }
      });
    });
    
    // Define consistent category order for grouping
    const categoryOrder = {
      'Infrastructure': 1,
      'Security': 2,
      'DevOps': 3,
      'Testing': 4,
      'Monitoring': 5,
      'Deployment': 6,
      'Marketing': 7,
      'Legal': 8
    };
    
    // Convert to array and sort by category first, then by name within category
    // This groups related tasks together and maintains stable order
    const tasksArray = Array.from(taskMap.values());
    
    tasksArray.sort((a, b) => {
      // Get category order (default to 999 for unknown categories)
      const catOrderA = categoryOrder[a.category] || 999;
      const catOrderB = categoryOrder[b.category] || 999;
      
      // First, sort by category
      if (catOrderA !== catOrderB) {
        return catOrderA - catOrderB;
      }
      
      // Within same category, sort by task name alphabetically
      return a.name.localeCompare(b.name);
    });
    
    return tasksArray;
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
  const updateTaskInProject = async (projectId, taskName, updates) => {
    console.log('updateTaskInProject called:', { projectId, taskName, updates });
    
    // Create unique key for this task update
    const taskKey = `${projectId}-${taskName}`;
    
    // Add to updating set for visual feedback
    setUpdatingTasks(prev => new Set([...prev, taskKey]));

    try {
      // Find the current project from props
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        console.error('Project not found in updateTaskInProject:', projectId);
        return;
      }
      
      console.log('Found project:', project);
      console.log('Project tasks:', project.tasks);
      
      // Update the specific task
      const updatedTasks = project.tasks.map(task =>
        task.name === taskName ? { ...task, ...updates } : task
      );
      
      const updatedProject = { ...project, tasks: updatedTasks };
      console.log('Created updatedProject:', updatedProject);
      
      // Pass the updated project object (not a function)
      await onUpdateProject(projectId, updatedProject);
      
      console.log('onUpdateProject completed successfully');
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      // Remove from updating set after update completes
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskKey);
        return newSet;
      });
    }
  };

  // Add missing task to a project
  const addMissingTask = async (projectId, taskTemplate) => {
    const taskKey = `${projectId}-${taskTemplate.name}`;
    
    // Prevent adding the same task multiple times concurrently
    if (addingTasks.has(taskKey)) {
      console.log('Task addition already in progress:', taskKey);
      return;
    }
    
    setUpdatingTasks(prev => new Set([...prev, taskKey]));
    setAddingTasks(prev => new Set([...prev, taskKey])); // Lock this specific task addition

    // Use functional update to get the LATEST project state
    try {
      await onUpdateProject(projectId, (currentProject) => {
        // Double-check task doesn't already exist (in case of race condition)
        const taskExists = currentProject.tasks.some(t => t.name === taskTemplate.name);
        if (taskExists) {
          console.log('Task already exists, skipping addition:', taskTemplate.name);
          return currentProject; // Return unchanged project
        }
        
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

        const updatedTasks = [...currentProject.tasks, newTask];
        return { ...currentProject, tasks: updatedTasks };
      });
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      // Remove from updating set
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskKey);
        return newSet;
      });
      // Unlock this specific task addition
      setAddingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskKey);
        return newSet;
      });
    }
  };

  // Remove task from a specific project
  const initiateTaskRemoval = (projectId, taskName) => {
    // Prevent initiating new deletion if one is in progress
    if (isDeletingTask) {
      return;
    }
    // Set the confirmation state to show inline confirm/cancel buttons
    setDeleteConfirmation({ projectId, taskName });
  };

  const confirmTaskRemoval = async () => {
    if (!deleteConfirmation || isDeletingTask) return;

    const { projectId, taskName } = deleteConfirmation;
    
    const taskKey = `${projectId}-${taskName}`;
    setUpdatingTasks(prev => new Set([...prev, taskKey]));
    setIsDeletingTask(true); // Lock deletion to prevent concurrent deletes

    // Use functional update to get the LATEST project state
    // This ensures we always work with the current state, even after multiple deletes
    try {
      await onUpdateProject(projectId, (currentProject) => {
        // Filter out the task from the CURRENT project state
        const updatedTasks = currentProject.tasks.filter(task => task.name !== taskName);
        return { ...currentProject, tasks: updatedTasks };
      });
    } catch (error) {
      console.error('Error removing task:', error);
    } finally {
      // Remove from updating set
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskKey);
        return newSet;
      });
      // Clear confirmation state
      setDeleteConfirmation(null);
      setIsDeletingTask(false); // Unlock deletion
    }
  };

  const cancelTaskRemoval = () => {
    if (isDeletingTask) return; // Don't allow cancel during deletion
    setDeleteConfirmation(null);
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

    // Call parent to update the projects order
    if (onReorderProjects) {
      onReorderProjects(newProjects);
    }
    
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
    setHasManualOrder(true); // Mark that user has manually reordered
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
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="mx-auto px-6 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900">Deployment Tracker</h1>
              <nav className="flex gap-1">
                <Link 
                  href="/dashboard" 
                  className="px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/table" 
                  className="px-2.5 py-1 text-sm text-white bg-blue-600 rounded"
                >
                  Table
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-6">
              {/* Compact Stats */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-600">{projects.length} projects</span>
                <span className="text-gray-300">•</span>
                <span className="font-semibold text-green-600">{overallStats.percentage}% complete</span>
                {isSavingOrder && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  </>
                )}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                <select
                  value={projectsPerPage}
                  onChange={(e) => {
                    setProjectsPerPage(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="text-xs text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="2">2</option>
                  <option value="4">4</option>
                  <option value="6">6</option>
                  <option value="8">8</option>
                  <option value={projects.length}>All</option>
                </select>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-600 px-2">
                      {currentPage + 1}/{totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                {session?.user?.image && (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name} 
                    className="w-7 h-7 rounded-full"
                  />
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Filters Section */}
          <div className="mt-2 pt-2 border-t">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-2 group"
            >
              <div className={`p-1 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors ${showFilters ? 'bg-blue-100' : ''}`}>
                <svg className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-90 text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <span>Filter & Group</span>
              {(selectedCategory !== 'all' || groupBy === 'category') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  {selectedCategory !== 'all' && selectedCategory}
                  {selectedCategory !== 'all' && groupBy === 'category' && ' • '}
                  {groupBy === 'category' && 'Grouped'}
                </span>
              )}
            </button>
            
            {showFilters && (
              <div className="space-y-3 pb-3">
                {/* Category Filter - Primary Action */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Filter by Category
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {categories.map(category => {
                      const count = category === 'all' 
                        ? allUniqueTaskNames.length 
                        : allUniqueTaskNames.filter(t => t.category === category).length;
                      const isActive = selectedCategory === category;
                      
                      return (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200 scale-105'
                              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <span>{category === 'all' ? '✦ All Tasks' : category}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isActive 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grouping Toggle - Secondary Action */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Display Mode
                  </label>
                  <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                    <button
                      onClick={() => setGroupBy('task')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        groupBy === 'task'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span>List View</span>
                    </button>
                    <button
                      onClick={() => setGroupBy('category')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        groupBy === 'category'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>Group by Category</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Simplified Table */}
      <div className="mx-auto p-3">
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          {groupedTasks.map((group, groupIdx) => (
            <div key={group.category}>
              {groupBy === 'category' && (
                <div className="bg-indigo-600 px-3 py-2 border-b">
                  <h2 className="text-sm font-bold text-white">{group.category}</h2>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800 border-b">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-white w-80 sticky left-0 bg-gray-800 z-10">
                        Task
                      </th>
                      {paginatedProjects.map((project, idx) => {
                        const globalIdx = startIndex + idx;
                        const isDragging = draggedProjectId === project.id;
                        const isDragOver = dragOverProjectId === project.id;
                        const completedCount = project.tasks.filter(t => t.status === 'Completed').length;
                        const totalCount = project.tasks.length;
                        
                        return (
                        <th 
                          key={project.id}
                          ref={(el) => projectRefs.current[project.id] = el}
                          className={`px-3 py-3 text-center min-w-[180px] max-w-[180px] cursor-grab active:cursor-grabbing transition-all bg-gray-800 border-r border-gray-700 relative ${
                            isReordering ? 'duration-300 ease-out' : 'duration-200'
                          } ${
                            isDragging 
                              ? 'opacity-50 scale-95 shadow-2xl z-50' 
                              : isDragOver 
                              ? 'bg-blue-600 ring-4 ring-blue-400 ring-opacity-50 scale-105 shadow-2xl' 
                              : 'hover:bg-gray-700'
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, project.id)}
                          onDragOver={(e) => handleDragOver(e, project.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, project.id)}
                          onDragEnd={handleDragEnd}
                        >
                          {/* Drag indicator - Always visible on hover */}
                          <div className={`absolute top-1 left-1/2 -translate-x-1/2 transition-all ${
                            isDragging 
                              ? 'opacity-0' 
                              : isDragOver 
                              ? 'opacity-100 scale-125' 
                              : 'opacity-40 group-hover:opacity-100'
                          }`}>
                            <svg className={`w-5 h-5 ${isDragOver ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 9h8M8 15h8" />
                            </svg>
                          </div>

                          {/* Drop zone indicators */}
                          {isDragOver && (
                            <>
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 animate-pulse"></div>
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-400 animate-pulse"></div>
                            </>
                          )}

                          <div className="flex flex-col items-center gap-1.5 relative z-10">
                            {/* Project Name */}
                            <div className={`text-white text-sm font-semibold px-2 text-center line-clamp-2 transition-all ${
                              isDragOver ? 'scale-105 text-white' : ''
                            }`} title={project.name}>
                              {project.name}
                            </div>
                            
                            {/* Progress Indicator */}
                            <div className="w-full px-2">
                              <div className="flex items-center justify-between text-[10px] text-gray-300 mb-1">
                                <span>{completedCount}/{totalCount}</span>
                                <span className="font-medium">
                                  {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    completedCount === totalCount && totalCount > 0
                                      ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                      : completedCount > 0
                                      ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                                      : 'bg-gray-600'
                                  }`}
                                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </th>
                      );
                      })}
                      <th className="px-2 py-2 text-center w-24 sticky right-0 bg-gray-800 z-10 text-white text-xs font-semibold border-l border-gray-700">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {group.tasks.map((taskTemplate, idx) => {
                      const stats = getTaskStats(taskTemplate.name);
                      const isEvenRow = idx % 2 === 0;
                      
                      return (
                        <tr key={`${taskTemplate.name}-${idx}`} className={`${isEvenRow ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                          <td className={`px-3 py-2 border-r sticky left-0 ${isEvenRow ? 'bg-white' : 'bg-gray-50'} z-10 hover:bg-blue-50`}>
                            <div className="text-sm font-semibold text-gray-900">{taskTemplate.name}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{taskTemplate.description}</div>
                            <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                              {taskTemplate.category}
                            </span>
                          </td>
                          
                          {paginatedProjects.map((project) => {
                            const task = findTaskInProject(project, taskTemplate.name);
                            const taskKey = `${project.id}-${taskTemplate.name}`;
                            const isUpdating = updatingTasks.has(taskKey);
                            const isAdding = addingTasks.has(taskKey);
                            const isConfirmingDelete = deleteConfirmation?.projectId === project.id && deleteConfirmation?.taskName === taskTemplate.name;
                            
                            if (!task) {
                              return (
                                <td key={project.id} className="px-2 py-2 text-center border-r">
                                  <button
                                    onClick={() => addMissingTask(project.id, taskTemplate)}
                                    disabled={isUpdating || isAdding}
                                    className="text-xs text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-colors"
                                    title={isAdding ? "Adding task..." : "Add this task to project"}
                                  >
                                    {isAdding ? '⟳ adding...' : '+ add'}
                                  </button>
                                </td>
                              );
                            }
                            
                            return (
                              <td key={project.id} className="px-2 py-2 border-r group relative">
                                {isConfirmingDelete ? (
                                  // Show confirmation buttons (replace entire cell)
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={cancelTaskRemoval}
                                      disabled={isUpdating || isDeletingTask}
                                      className="px-2 py-1 text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Cancel"
                                    >
                                      ✕ Cancel
                                    </button>
                                    <button
                                      onClick={confirmTaskRemoval}
                                      disabled={isUpdating || isDeletingTask}
                                      className="px-2 py-1 text-[10px] font-semibold bg-red-500 hover:bg-red-600 text-white rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Confirm removal"
                                    >
                                      {isDeletingTask && isUpdating ? (
                                        <span className="flex items-center gap-1">
                                          <span className="inline-block w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></span>
                                          Removing...
                                        </span>
                                      ) : (
                                        '✓ Remove'
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-center gap-2">
                                      {/* Custom Styled Checkbox */}
                                      <label className="flex-shrink-0 cursor-pointer group">
                                        <div className="relative">
                                          <input
                                            type="checkbox"
                                            checked={task.status === 'Completed'}
                                            readOnly
                                            disabled={isUpdating}
                                            className="sr-only peer"
                                          />
                                          <div 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!isUpdating) {
                                                const isCompleted = task.status !== 'Completed';
                                                updateTaskInProject(project.id, task.name, {
                                                  status: isCompleted ? 'Completed' : 'Not Started',
                                                  completed_at: isCompleted ? new Date().toISOString() : null
                                                });
                                              }
                                            }}
                                            className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                                            task.status === 'Completed'
                                              ? 'bg-blue-600 border-blue-600'
                                              : 'bg-white border-gray-300 hover:border-blue-500'
                                          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                            {task.status === 'Completed' && (
                                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                              </svg>
                                            )}
                                          </div>
                                          {isUpdating && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                            </div>
                                          )}
                                        </div>
                                      </label>

                                      {/* Status Dropdown */}
                                      <select
                                        value={task.status}
                                        onChange={(e) => updateTaskInProject(project.id, task.name, {
                                          status: e.target.value
                                        })}
                                        disabled={isUpdating}
                                        className={`flex-1 min-w-0 px-2 py-1 text-xs rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                          task.status === 'Completed'
                                            ? 'bg-green-50 border-green-300 text-green-800 font-medium'
                                            : task.status === 'In Progress'
                                            ? 'bg-blue-50 border-blue-300 text-blue-800 font-medium'
                                            : task.status === 'Blocked'
                                            ? 'bg-red-50 border-red-300 text-red-800 font-medium'
                                            : 'bg-gray-50 border-gray-300 text-gray-800'
                                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                      >
                                        {statusOptions.map(opt => (
                                          <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>

                                      {/* User Profile Picture - Shows who last updated */}
                                      {task.updated_by_user_image && (
                                        <div className="flex-shrink-0" title={`Last updated by ${task.updated_by_user_name || 'Unknown'}`}>
                                          <img 
                                            src={task.updated_by_user_image} 
                                            alt={task.updated_by_user_name || 'User'} 
                                            className="w-6 h-6 rounded-full border border-gray-300 object-cover"
                                          />
                                        </div>
                                      )}
                                    </div>

                                    {/* Delete Button - Shows on hover */}
                                    <button
                                      onClick={() => initiateTaskRemoval(project.id, task.name)}
                                      disabled={isUpdating || isDeletingTask}
                                      className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5 text-[9px] rounded bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 disabled:opacity-30"
                                      title={isDeletingTask ? "Another deletion in progress" : "Remove this task from this project"}
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}
                              </td>
                            );
                          })}
                          
                          <td className={`px-2 py-2 text-center border-l sticky right-0 ${isEvenRow ? 'bg-white' : 'bg-gray-50'} z-10 hover:bg-blue-50`}>
                            <div className={`text-lg font-bold ${
                              stats.percentage === 100 ? 'text-green-600' :
                              stats.percentage >= 50 ? 'text-blue-600' :
                              stats.percentage > 0 ? 'text-yellow-600' :
                              'text-gray-400'
                            }`}>
                              {Math.round(stats.percentage)}%
                            </div>
                            <div className="text-[10px] text-gray-600">{stats.completed}/{stats.total}</div>
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
