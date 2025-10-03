"use client";
import { useState, useMemo, useEffect, useRef, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Footer from "@/components/Footer";

const statusOptions = [
  { value: "Not Started", label: "Not Started", color: "gray" },
  { value: "In Progress", label: "In Progress", color: "blue" },
  { value: "Completed", label: "Completed", color: "green" },
  { value: "Blocked", label: "Blocked", color: "red" },
];

const categoryColors = {
  'Infrastructure': 'bg-blue-100 text-blue-700 border-blue-200',
  'Security': 'bg-red-100 text-red-700 border-red-200',
  'Monitoring': 'bg-purple-100 text-purple-700 border-purple-200',
  'DevOps': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Testing': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Marketing': 'bg-pink-100 text-pink-700 border-pink-200',
  'Legal': 'bg-orange-100 text-orange-700 border-orange-200',
  'Deployment': 'bg-green-100 text-green-700 border-green-200'
};

// Get darker header colors based on category
const getCategoryHeaderColor = (category) => {
  const colorMap = {
    'Infrastructure': 'bg-blue-600',
    'Security': 'bg-red-600',
    'Monitoring': 'bg-purple-600',
    'DevOps': 'bg-indigo-600',
    'Testing': 'bg-yellow-600',
    'Marketing': 'bg-pink-600',
    'Legal': 'bg-orange-600',
    'Deployment': 'bg-green-600'
  };
  return colorMap[category] || 'bg-indigo-600';
};

// Get active filter button colors based on category
const getCategoryActiveColors = (category) => {
  const colorMap = {
    'Infrastructure': 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200',
    'Security': 'bg-red-600 text-white shadow-md ring-2 ring-red-200',
    'Monitoring': 'bg-purple-600 text-white shadow-md ring-2 ring-purple-200',
    'DevOps': 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200',
    'Testing': 'bg-yellow-600 text-white shadow-md ring-2 ring-yellow-200',
    'Marketing': 'bg-pink-600 text-white shadow-md ring-2 ring-pink-200',
    'Legal': 'bg-orange-600 text-white shadow-md ring-2 ring-orange-200',
    'Deployment': 'bg-green-600 text-white shadow-md ring-2 ring-green-200'
  };
  return colorMap[category] || 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200';
};

// Get hover colors for filter buttons based on category
const getCategoryHoverColors = (category) => {
  const colorMap = {
    'Infrastructure': 'hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
    'Security': 'hover:border-red-300 hover:bg-red-50 hover:text-red-700',
    'Monitoring': 'hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700',
    'DevOps': 'hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700',
    'Testing': 'hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-700',
    'Marketing': 'hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700',
    'Legal': 'hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700',
    'Deployment': 'hover:border-green-300 hover:bg-green-50 hover:text-green-700'
  };
  return colorMap[category] || 'hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700';
};

// Get badge background color for active filter buttons
const getCategoryBadgeColor = (category) => {
  const colorMap = {
    'Infrastructure': 'bg-blue-500',
    'Security': 'bg-red-500',
    'Monitoring': 'bg-purple-500',
    'DevOps': 'bg-indigo-500',
    'Testing': 'bg-yellow-500',
    'Marketing': 'bg-pink-500',
    'Legal': 'bg-orange-500',
    'Deployment': 'bg-green-500'
  };
  return colorMap[category] || 'bg-blue-500';
};

function TableView({
  projects,
  onUpdateProject,
  onReorderProjects,
  session,
  totalProjectsCount: totalProjectsCountProp,
  activeProjectsCount = projects.length,
  archivedProjectsCount = 0,
  showArchived = false,
  onShowArchived,
  onShowActive,
  onArchiveProject,
  onRestoreProject,
  isLoadingArchived = false,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [groupBy, setGroupBy] = useState("category"); // 'task' or 'category'
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [projectsPerPage, setProjectsPerPage] = useState(6);
  const [isClient, setIsClient] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState(() =>
    projects.map((project) => project.id)
  );
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const previousProjectIdsRef = useRef(projects.map((project) => project.id));

  // Set isClient flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Keep selected project IDs in sync with project list, while preserving manual selections
  useEffect(() => {
    const currentProjectIds = projects.map((project) => project.id);
    const previousProjectIds = previousProjectIdsRef.current;

    setSelectedProjectIds((prevIds) => {
      const selectedSet = new Set(prevIds);
      let hasNewProject = false;

      currentProjectIds.forEach((id) => {
        if (!selectedSet.has(id) && !previousProjectIds.includes(id)) {
          selectedSet.add(id);
          hasNewProject = true;
        }
      });

      const normalizedIds = currentProjectIds.filter((id) =>
        selectedSet.has(id)
      );

      if (
        !hasNewProject &&
        normalizedIds.length === prevIds.length &&
        normalizedIds.every((id, index) => id === prevIds[index])
      ) {
        return prevIds;
      }

      return normalizedIds;
    });

    previousProjectIdsRef.current = currentProjectIds;
  }, [projects]);

  // Reset pagination when the selected project set changes
  useEffect(() => {
    setCurrentPage((prev) => (prev === 0 ? prev : 0));
  }, [selectedProjectIds]);

  const visibleProjects = useMemo(() => {
    if (selectedProjectIds.length === 0) {
      return [];
    }
    const selectedSet = new Set(selectedProjectIds);
    return projects.filter((project) => selectedSet.has(project.id));
  }, [projects, selectedProjectIds]);

  const availableProjectsCount = projects.length;
  const totalProjectsCount =
    typeof totalProjectsCountProp === "number"
      ? totalProjectsCountProp
      : availableProjectsCount;
  const totalSelectedProjects = selectedProjectIds.length;
  const allProjectsSelected =
    availableProjectsCount > 0 && totalSelectedProjects === availableProjectsCount;
  const viewLabel = showArchived ? "archived" : "active";
  const projectSelectionLabel =
    availableProjectsCount === 0
      ? `No ${viewLabel} projects`
      : `${totalSelectedProjects} of ${availableProjectsCount} ${viewLabel} projects`;

  // Calculate pagination
  const effectiveProjectsPerPage = Math.min(projectsPerPage, 6);
  const totalPages = Math.ceil(
    visibleProjects.length / effectiveProjectsPerPage
  );
  const startIndex = currentPage * effectiveProjectsPerPage;
  const endIndex = startIndex + effectiveProjectsPerPage;
  const paginatedProjects = visibleProjects.slice(startIndex, endIndex);

  // Reset to first page if current page is out of bounds
  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 0) {
        setCurrentPage(0);
      }
      return;
    }

    if (currentPage >= totalPages) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  // Get all unique task names across all projects, maintaining STABLE order
  // Task order should NOT change when projects are reordered
  const allUniqueTaskNames = useMemo(() => {
    const taskMap = new Map();

    // Collect all unique tasks from all projects
    visibleProjects.forEach((project) => {
      project.tasks.forEach((task) => {
        if (!taskMap.has(task.name)) {
          taskMap.set(task.name, {
            name: task.name,
            description: task.description,
            category: task.category,
            required: task.required,
            // Use the task's database ID for stable sorting if available
            id: task.id,
          });
        }
      });
    });

    // Define consistent category order for grouping
    const categoryOrder = {
      Infrastructure: 1,
      Security: 2,
      DevOps: 3,
      Testing: 4,
      Monitoring: 5,
      Deployment: 6,
      Marketing: 7,
      Legal: 8,
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
  }, [visibleProjects]);

  // Get all unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    visibleProjects.forEach((project) => {
      project.tasks.forEach((task) => cats.add(task.category));
    });
    return ["all", ...Array.from(cats)];
  }, [visibleProjects]);

  // Filter tasks by category AND ensure they exist in at least one project
  const filteredTasks = useMemo(() => {
    // First filter by category
    const categoryFiltered =
      selectedCategory === "all"
        ? allUniqueTaskNames
        : allUniqueTaskNames.filter((t) => t.category === selectedCategory);

    // Then filter out tasks that don't exist in ANY project
    // (This ensures rows disappear when all instances are deleted)
    return categoryFiltered.filter((taskTemplate) => {
      return visibleProjects.some((project) =>
        project.tasks.some((task) => task.name === taskTemplate.name)
      );
    });
  }, [allUniqueTaskNames, selectedCategory, visibleProjects]);

  // Group tasks by category if needed
  const groupedTasks = useMemo(() => {
    if (groupBy === "task") {
      return [{ category: "All Tasks", tasks: filteredTasks }];
    }

    const groups = {};
    filteredTasks.forEach((task) => {
      if (!groups[task.category]) {
        groups[task.category] = [];
      }
      groups[task.category].push(task);
    });

    return Object.entries(groups).map(([category, tasks]) => ({
      category,
      tasks,
    }));
  }, [filteredTasks, groupBy]);

  // Find task in project
  const findTaskInProject = (project, taskName) => {
    return project.tasks.find((t) => t.name === taskName);
  };

  // Update task in project
  const updateTaskInProject = async (projectId, taskName, updates, options = {}) => {
    console.log("updateTaskInProject called:", {
      projectId,
      taskName,
      updates,
    });

    const useTaskEndpoint = options.useTaskEndpoint === true;

    // Create unique key for this task update
    const taskKey = `${projectId}-${taskName}`;

    // Add to updating set for visual feedback
    setUpdatingTasks((prev) => new Set([...prev, taskKey]));

    try {
      // Use functional update to get the LATEST project state
      // This ensures we always work with current data, even after multiple rapid updates
      await onUpdateProject(projectId, (currentProject) => {
        console.log("Functional update - current project:", currentProject);
        console.log("Project tasks:", currentProject.tasks);

        // Update the specific task
        const updatedTasks = currentProject.tasks.map((task) =>
          task.name === taskName ? { ...task, ...updates } : task
        );

        const changedTask = updatedTasks.find((task) => task.name === taskName);
        const updatedProject = {
          ...currentProject,
          tasks: updatedTasks,
        };

        if (updatedProject.changedTaskIds) {
          delete updatedProject.changedTaskIds;
        }
        if (updatedProject.__taskUpdate) {
          delete updatedProject.__taskUpdate;
        }

        const persistedTaskId = changedTask?.id && !String(changedTask.id).startsWith("custom-");

        if (changedTask?.id) {
          if (useTaskEndpoint && persistedTaskId) {
            updatedProject.__taskUpdate = {
              taskId: changedTask.id,
              updates: { ...updates },
            };
          } else {
            updatedProject.changedTaskIds = [changedTask.id];
          }
        }
        console.log("Created updatedProject:", updatedProject);

        return updatedProject;
      });

      console.log("onUpdateProject completed successfully");
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      // Remove from updating set after update completes
      setUpdatingTasks((prev) => {
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
      console.log("Task addition already in progress:", taskKey);
      return;
    }

    setUpdatingTasks((prev) => new Set([...prev, taskKey]));
    setAddingTasks((prev) => new Set([...prev, taskKey])); // Lock this specific task addition

    // Use functional update to get the LATEST project state
    try {
      await onUpdateProject(projectId, (currentProject) => {
        // Double-check task doesn't already exist (in case of race condition)
        const taskExists = currentProject.tasks.some(
          (t) => t.name === taskTemplate.name
        );
        if (taskExists) {
          console.log(
            "Task already exists, skipping addition:",
            taskTemplate.name
          );
          return currentProject; // Return unchanged project
        }

        // Create new task with default values
        const newTask = {
          name: taskTemplate.name,
          description: taskTemplate.description,
          category: taskTemplate.category,
          required: taskTemplate.required,
          status: "Not Started",
          notes: "",
          targetDate: null,
          completedDate: null,
        };

        const updatedTasks = [...currentProject.tasks, newTask];
        return { ...currentProject, tasks: updatedTasks };
      });
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      // Remove from updating set
      setUpdatingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskKey);
        return newSet;
      });
      // Unlock this specific task addition
      setAddingTasks((prev) => {
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
    setUpdatingTasks((prev) => new Set([...prev, taskKey]));
    setIsDeletingTask(true); // Lock deletion to prevent concurrent deletes

    // Use functional update to get the LATEST project state
    // This ensures we always work with the current state, even after multiple deletes
    try {
      await onUpdateProject(projectId, (currentProject) => {
        // Filter out the task from the CURRENT project state
        const updatedTasks = currentProject.tasks.filter(
          (task) => task.name !== taskName
        );
        return { ...currentProject, tasks: updatedTasks };
      });
    } catch (error) {
      console.error("Error removing task:", error);
    } finally {
      // Remove from updating set
      setUpdatingTasks((prev) => {
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
    if (showArchived) {
      e.preventDefault();
      return;
    }
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target);
  };

  const handleDragOver = (e, projectId) => {
    if (showArchived) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (projectId && projectId !== draggedProjectId) {
      setDragOverProjectId(projectId);
    }
  };

  const handleDragLeave = (e) => {
    if (showArchived) return;
    // Only clear if we're leaving the drop zone completely
    if (e.currentTarget === e.target) {
      setDragOverProjectId(null);
    }
  };

  const handleDrop = async (e, targetProjectId) => {
    if (showArchived) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setDragOverProjectId(null);

    if (draggedProjectId === targetProjectId) {
      setDraggedProjectId(null);
      return;
    }

    const draggedIndex = projects.findIndex((p) => p.id === draggedProjectId);
    const targetIndex = projects.findIndex((p) => p.id === targetProjectId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedProjectId(null);
      return;
    }

    // Capture positions before reorder (FLIP: First)
    const beforePositions = {};
    projects.forEach((project) => {
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
      newProjects.forEach((project) => {
        const el = projectRefs.current[project.id];
        if (el && beforePositions[project.id]) {
          const rect = el.getBoundingClientRect();
          const deltaX = beforePositions[project.id].left - rect.left;
          const deltaY = beforePositions[project.id].top - rect.top;

          // Invert: Apply transform to make it look like it's still in the old position
          if (deltaX !== 0 || deltaY !== 0) {
            el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            el.style.transition = "none";

            // Play: Animate to new position
            requestAnimationFrame(() => {
              el.style.transition =
                "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
              el.style.transform = "translate(0, 0)";
            });
          }
        }
      });

      // Clean up after animation
      setTimeout(() => {
        newProjects.forEach((project) => {
          const el = projectRefs.current[project.id];
          if (el) {
            el.style.transition = "";
            el.style.transform = "";
          }
        });
        setIsReordering(false);
        setDraggedProjectId(null);
      }, 300);
    });

    // Save the new order to the server
    await saveProjectOrder(newProjects.map((p) => p.id));
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
    setDragOverProjectId(null);
  };

  const toggleProjectSelection = (projectId) => {
    setSelectedProjectIds((prevIds) => {
      if (prevIds.includes(projectId)) {
        return prevIds.filter((id) => id !== projectId);
      }

      const nextSet = new Set([...prevIds, projectId]);
      return projects
        .filter((project) => nextSet.has(project.id))
        .map((project) => project.id);
    });
  };

  const handleToggleAllProjects = () => {
    if (allProjectsSelected) {
      setSelectedProjectIds([]);
      return;
    }

    setSelectedProjectIds(projects.map((project) => project.id));
  };

  const saveProjectOrder = async (projectIds) => {
    setIsSavingOrder(true);
    setHasManualOrder(true); // Mark that user has manually reordered
    try {
      const response = await fetch("/api/projects/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectOrder: projectIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to save project order");
      }
    } catch (error) {
      console.error("Error saving project order:", error);
      // Optionally show toast notification
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Calculate completion stats for a task across all projects
  const getTaskStats = (taskName) => {
    let total = 0;
    let completed = 0;
    let blocked = 0;

    visibleProjects.forEach((project) => {
      const task = findTaskInProject(project, taskName);
      if (task) {
        total++;
        if (task.status === "Completed") completed++;
        if (task.status === "Blocked") blocked++;
      }
    });

    // Count completed + blocked as "done" for percentage calculation
    const done = completed + blocked;

    return {
      total,
      completed,
      blocked,
      done,
      percentage: total > 0 ? (done / total) * 100 : 0,
    };
  };

  // Calculate overall stats
  const visibleStats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;

    visibleProjects.forEach((project) => {
      project.tasks.forEach((task) => {
        totalTasks++;
        if (task.status === "Completed") completedTasks++;
      });
    });

    return {
      total: totalTasks,
      completed: completedTasks,
      percentage:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [visibleProjects]);

  if (totalProjectsCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-md">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Projects Available
          </h3>
          <p className="text-gray-600 mb-6">
            Create some projects first to use the table view
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <div className="flex-1 min-h-screen">
      {/* Professional Header (matches Landing Page) */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="mx-auto px-6 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Horizon
                  </h1>
                  <p className="text-xs text-gray-600">Deployment Management</p>
                </div>
              </div>
              <nav className="flex gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/table"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Table View
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Compact Stats */}
              <div className="flex items-center gap-3 text-sm bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowProjectDropdown((prev) => !prev)}
                    className="flex items-center gap-1.5 font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    <span>{projectSelectionLabel}</span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        showProjectDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {activeProjectsCount} {activeProjectsCount === 1 ? 'project' : 'projects'}
                  </p>

                  {showProjectDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowProjectDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                          <span className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                            Select projects
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleAllProjects()}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            {allProjectsSelected ? "Clear all" : "Select all"}
                          </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto py-1">
                          {projects.map((project) => {
                            const isSelected = selectedProjectIds.includes(project.id);
                            return (
                              <button
                                key={project.id}
                                type="button"
                                onClick={() => toggleProjectSelection(project.id)}
                                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
                                  isSelected
                                    ? "bg-blue-50 text-blue-700"
                                    : "hover:bg-gray-50 text-gray-700"
                                }`}
                              >
                                <span className="truncate pr-2">{project.name}</span>
                                <span
                                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                                      : "border-gray-300 text-transparent"
                                  }`}
                                >
                                  <svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </span>
                              </button>
                            );
                          })}
                          {projects.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500">
                              No projects available.
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            {totalSelectedProjects} selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowProjectDropdown(false)}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <span className="text-gray-300">•</span>
                <span className="font-semibold text-blue-600">
                  {visibleStats.percentage}% complete
                </span>
                {isSavingOrder && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <svg
                        className="animate-spin h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </span>
                  </>
                )}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <label htmlFor="projectsPerPage" className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  Projects per page:
                </label>
                <select
                  id="projectsPerPage"
                  value={projectsPerPage}
                  onChange={(e) => {
                    setProjectsPerPage(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="text-xs text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2">2</option>
                  <option value="4">4</option>
                  <option value="6">6</option>
                </select>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(0, currentPage - 1))
                      }
                      disabled={currentPage === 0}
                      className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-600 px-2">
                      {currentPage + 1}/{totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage(
                          Math.min(totalPages - 1, currentPage + 1)
                        )
                      }
                      disabled={currentPage >= totalPages - 1}
                      className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* User Profile */}
              {session?.user && (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    {session.user.image && (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User avatar"}
                        width={32}
                        height={32}
                        unoptimized
                        className="w-8 h-8 rounded-full border-2 border-blue-500 shadow-md"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {session.user.name}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Filters Section */}
          <div className="mx-auto px-6">
            <div className="mt-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-2 group"
              >
                <div
                  className={`p-1 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors ${
                    showFilters ? "bg-blue-100" : ""
                  }`}
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${
                      showFilters ? "rotate-90 text-blue-600" : "text-gray-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <span>Filter & Group</span>
                {(selectedCategory !== "all" || groupBy === "category") && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                    {selectedCategory !== "all" && selectedCategory}
                    {selectedCategory !== "all" &&
                      groupBy === "category" &&
                      " • "}
                    {groupBy === "category" && "Grouped"}
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
                      {categories.map((category) => {
                        const count =
                          category === "all"
                            ? allUniqueTaskNames.length
                            : allUniqueTaskNames.filter(
                                (t) => t.category === category
                              ).length;
                        const isActive = selectedCategory === category;

                        return (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                              isActive
                                ? category === "all"
                                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-200 scale-105"
                                  : `${getCategoryActiveColors(category)} scale-105`
                                : `bg-white text-gray-700 border-2 border-gray-200 ${category === "all" ? "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700" : getCategoryHoverColors(category)}`
                            }`}
                          >
                            <span>
                              {category === "all" ? "✦ All Tasks" : category}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isActive
                                  ? `${category === "all" ? "bg-blue-500" : getCategoryBadgeColor(category)} text-white`
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
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
                        onClick={() => setGroupBy("category")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          groupBy === "category"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        <span>Group by Category</span>
                      </button>
                      <button
                        onClick={() => setGroupBy("task")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          groupBy === "task"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                        <span>List View</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Simplified Table */}
      <div className="mx-auto p-3">
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          {visibleProjects.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-600">
              {showArchived && isLoadingArchived
                ? "Loading archived projects..."
                : `No ${viewLabel} projects selected. Use the dropdown above to choose which projects to display.`}
            </div>
          ) : groupedTasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-600">
              No tasks match the current filters for the selected projects.
            </div>
          ) : (
            groupedTasks.map((group, groupIdx) => (
              <div key={group.category}>
                {groupBy === "category" && (
                  <div className={`${getCategoryHeaderColor(group.category)} px-3 py-2 border-b`}>
                    <h2 className="text-sm font-bold text-white">
                      {group.category}
                    </h2>
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
                        const completedCount = project.tasks.filter(
                          (t) => t.status === "Completed"
                        ).length;
                        const totalCount = project.tasks.length;

                        return (
                          <th
                            key={project.id}
                            ref={(el) => (projectRefs.current[project.id] = el)}
                            className={`px-3 py-3 text-center min-w-[180px] max-w-[180px] cursor-grab active:cursor-grabbing transition-all bg-gray-800 border-r border-gray-700 relative ${
                              isReordering
                                ? "duration-300 ease-out"
                                : "duration-200"
                            } ${
                              isDragging
                                ? "opacity-50 scale-95 shadow-2xl z-50"
                                : isDragOver
                                ? "bg-blue-600 ring-4 ring-blue-400 ring-opacity-50 scale-105 shadow-2xl"
                                : "hover:bg-gray-700"
                            }`}
                            draggable={!showArchived}
                            onDragStart={(e) => handleDragStart(e, project.id)}
                            onDragOver={(e) => handleDragOver(e, project.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, project.id)}
                            onDragEnd={handleDragEnd}
                          >
                            {/* Drag indicator - Always visible on hover */}
                            <div
                              className={`absolute top-1 left-1/2 -translate-x-1/2 transition-all ${
                                isDragging
                                  ? "opacity-0"
                                  : isDragOver
                                  ? "opacity-100 scale-125"
                                  : "opacity-40 group-hover:opacity-100"
                              }`}
                            >
                              <svg
                                className={`w-5 h-5 ${
                                  isDragOver ? "text-white" : "text-gray-400"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M8 9h8M8 15h8"
                                />
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
                              <div
                                className={`text-white text-sm font-semibold px-2 text-center line-clamp-2 transition-all ${
                                  isDragOver ? "scale-105 text-white" : ""
                                }`}
                                title={project.name}
                              >
                                {project.name}
                              </div>

                              {/* Progress Indicator */}
                              <div className="w-full px-2">
                                <div className="flex items-center justify-between text-[10px] text-gray-300 mb-1">
                                  <span>
                                    {completedCount}/{totalCount}
                                  </span>
                                  <span className="font-medium">
                                    {totalCount > 0
                                      ? Math.round(
                                          (completedCount / totalCount) * 100
                                        )
                                      : 0}
                                    %
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                      completedCount === totalCount &&
                                      totalCount > 0
                                        ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                        : completedCount > 0
                                        ? "bg-gradient-to-r from-blue-400 to-blue-600"
                                        : "bg-gray-600"
                                    }`}
                                    style={{
                                      width: `${
                                        totalCount > 0
                                          ? (completedCount / totalCount) * 100
                                          : 0
                                      }%`,
                                    }}
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

                      // Check if any projects are missing this task
                      return (
                        <tr
                          key={`${taskTemplate.name}-${idx}`}
                          className={`${
                            isEvenRow ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50 group/row`}
                        >
                          <td
                            className={`px-3 py-2 border-r sticky left-0 ${
                              isEvenRow ? "bg-white" : "bg-gray-50"
                            } z-10 hover:bg-blue-50 relative`}
                          >
                            <div className="text-sm font-semibold text-gray-900">
                              {taskTemplate.name}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {taskTemplate.description}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-block text-xs px-1.5 py-0.5 rounded border font-medium ${categoryColors[taskTemplate.category] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {taskTemplate.category}
                              </span>
                            </div>
                          </td>

                          {paginatedProjects.map((project) => {
                            const task = findTaskInProject(
                              project,
                              taskTemplate.name
                            );
                            const taskKey = `${project.id}-${taskTemplate.name}`;
                            const isUpdating = updatingTasks.has(taskKey);
                            const isAdding = addingTasks.has(taskKey);
                            const isConfirmingDelete =
                              deleteConfirmation?.projectId === project.id &&
                              deleteConfirmation?.taskName ===
                                taskTemplate.name;

                            if (!task) {
                              return (
                                <td
                                  key={project.id}
                                  className="px-2 py-2 text-center border-r"
                                >
                                  <button
                                    onClick={() =>
                                      addMissingTask(project.id, taskTemplate)
                                    }
                                    disabled={isUpdating || isAdding}
                                    className="text-xs text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-colors"
                                    title={
                                      isAdding
                                        ? "Adding task..."
                                        : "Add this task to project"
                                    }
                                  >
                                    {isAdding ? "⟳ adding..." : "+ add"}
                                  </button>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={project.id}
                                className="px-2 py-2 border-r group relative"
                              >
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
                                        "✓ Remove"
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-start gap-2">
                                      {/* Left column: Checkbox and Info Icon */}
                                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                        {/* Custom Styled Checkbox */}
                                        <label className="cursor-pointer group">
                                          <div className="relative">
                                            <input
                                              type="checkbox"
                                              checked={
                                                task.status === "Completed"
                                              }
                                              readOnly
                                              disabled={
                                                isUpdating ||
                                                task.status === "Blocked"
                                              }
                                              className="sr-only peer"
                                            />
                                            <div
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Prevent checking/unchecking if blocked or updating
                                                if (
                                                  !isUpdating &&
                                                  task.status !== "Blocked"
                                                ) {
                                                  const isCompleted =
                                                    task.status !== "Completed";
                                                  updateTaskInProject(
                                                    project.id,
                                                    task.name,
                                                    {
                                                      status: isCompleted
                                                        ? "Completed"
                                                        : "Not Started",
                                                      completed_at: isCompleted
                                                        ? new Date().toISOString()
                                                        : null,
                                                    },
                                                    { useTaskEndpoint: true }
                                                  );
                                                }
                                              }}
                                              className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                                                task.status === "Completed"
                                                  ? "bg-blue-600 border-blue-600"
                                                  : task.status === "Blocked"
                                                  ? "bg-red-100 border-red-300 cursor-not-allowed"
                                                  : "bg-white border-gray-300 hover:border-blue-500"
                                              } ${
                                                isUpdating || task.status === "Blocked"
                                                  ? "cursor-not-allowed"
                                                  : "cursor-pointer"
                                              }`}
                                            >
                                              {task.status === "Completed" && (
                                                <svg
                                                  className="w-3.5 h-3.5 text-white"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={3}
                                                    d="M5 13l4 4L19 7"
                                                  />
                                                </svg>
                                              )}
                                              {task.status === "Blocked" && (
                                                <svg
                                                  className="w-3.5 h-3.5 text-red-500"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2.5}
                                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                  />
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

                                      </div>

                                      {/* Right column: Status Dropdown */}
                                      <div className="flex-1 min-w-0">
                                        {/* Status Dropdown */}
                                        <select
                                          value={task.status}
                                          onChange={(e) => {
                                            const nextStatus = e.target.value;
                                            const statusUpdates = { status: nextStatus };
                                            statusUpdates.completed_at = nextStatus === "Completed" ? new Date().toISOString() : null;

                                            updateTaskInProject(
                                              project.id,
                                              task.name,
                                              statusUpdates,
                                              { useTaskEndpoint: true }
                                            );
                                          }}
                                          disabled={isUpdating}
                                          className={`w-full px-2 py-1 text-xs rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                            task.status === "Completed"
                                              ? "bg-green-50 border-green-300 text-green-800 font-medium"
                                              : task.status === "In Progress"
                                              ? "bg-blue-50 border-blue-300 text-blue-800 font-medium"
                                              : task.status === "Blocked"
                                              ? "bg-red-50 border-red-300 text-red-800 font-medium"
                                              : "bg-gray-50 border-gray-300 text-gray-800"
                                          } ${
                                            isUpdating
                                              ? "opacity-50 cursor-not-allowed"
                                              : "cursor-pointer"
                                          }`}
                                        >
                                          {statusOptions.map((opt) => (
                                            <option
                                              key={opt.value}
                                              value={opt.value}
                                            >
                                              {opt.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    {/* Delete Button - Shows on hover */}
                                    <button
                                      onClick={() =>
                                        initiateTaskRemoval(
                                          project.id,
                                          task.name
                                        )
                                      }
                                      disabled={isUpdating || isDeletingTask}
                                      className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5 text-[9px] rounded bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 disabled:opacity-30"
                                      title={
                                        isDeletingTask
                                          ? "Another deletion in progress"
                                          : "Remove this task from this project"
                                      }
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}
                              </td>
                            );
                          })}

                          <td
                            className={`px-2 py-2 text-center border-l sticky right-0 ${
                              isEvenRow ? "bg-white" : "bg-gray-50"
                            } z-10 hover:bg-blue-50`}
                          >
                            {stats.total === stats.blocked ? (
                              // All tasks are blocked - show N/A
                              <>
                                <div className="text-lg font-bold text-red-600">
                                  N/A
                                </div>
                                <div className="text-[10px] text-gray-600">
                                  0/0
                                </div>
                              </>
                            ) : (
                              // Normal display
                              <>
                                <div
                                  className={`text-lg font-bold ${
                                    stats.percentage === 100
                                      ? "text-green-600"
                                      : stats.percentage >= 50
                                      ? "text-blue-600"
                                      : stats.percentage > 0
                                      ? "text-yellow-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {Math.round(stats.percentage)}%
                                </div>
                                <div className="text-[10px] flex items-center justify-center gap-0.5">
                                  <span className="text-green-600 font-semibold">
                                    {stats.completed}
                                  </span>
                                  <span className="text-gray-400">/</span>
                                  <span
                                    className={
                                      stats.blocked > 0
                                        ? "text-red-600 font-semibold"
                                        : "text-gray-600"
                                    }
                                  >
                                    {stats.total - stats.blocked}
                                  </span>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

// Memoize to prevent re-renders when parent state changes but props haven't
export default memo(TableView);
