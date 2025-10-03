"use client";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProjectChecklist from "@/components/ProjectChecklist";
import Toast from "@/components/Toast";
import Link from "next/link";
import CreateProjectModal from "@/components/CreateProjectModal";
import Footer from "@/components/Footer";
import { mergeProjectUpdate } from "@/lib/client/mergeProjectUpdate";
import { prepareProjectPayload } from "@/lib/client/prepareProjectPayload";

export default function DashboardClient({ initialProjects, session }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sortBy, setSortBy] = useState("custom"); // 'custom', 'deadline', 'alpha', 'completion'
  const [draggedProjectId, setDraggedProjectId] = useState(null);
  const [dragOverProjectId, setDragOverProjectId] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false); // Track if any project modal is open
  const projectRefs = useRef({});

  // Toast notification helper
  const showToast = useCallback((message, type = "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addProject = async (projectType, tasks) => {
    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const newProject = {
      id: tempId,
      name: `New Project ${projects.length + 1}`,
      description: "Project description",
      client: "Client Name",
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      status: "Planning",
      project_type: projectType, // Store the project type
      tasks: tasks || [],
    };

    // Optimistic update - add to UI immediately
    setProjects([...projects, newProject]);
    setShowNewProjectModal(false);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) throw new Error("Failed to create project");

      // Replace temporary project with real one from server
      const createdProject = await response.json();
      setProjects((prevProjects) =>
        prevProjects.map((p) => (p.id === tempId ? createdProject : p))
      );

      // Refresh to get server state
      router.refresh();
    } catch (e) {
      console.error("Error creating project:", e);
      // Remove temporary project on error
      setProjects((prevProjects) =>
        prevProjects.filter((p) => p.id !== tempId)
      );
      showToast("Failed to create project. Please try again.", "error");
    }
  };

  const deleteProject = useCallback(async (projectId) => {
    if (
      confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      // Optimistic update - remove from UI immediately
      const previousProjects = [...projects];
      setProjects(projects.filter((p) => p.id !== projectId));

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete project");

        // Refresh to get server state
        router.refresh();
      } catch (e) {
        console.error("Error deleting project:", e);
        // Rollback on error
        setProjects(previousProjects);
        showToast("Failed to delete project. It has been restored.", "error");
      }
    }
  }, [projects, router, showToast]);

  const updateProject = useCallback(async (projectId, updatedProjectOrFunction) => {
    // If it's a direct object (from child after API success), just update state
    if (typeof updatedProjectOrFunction !== "function") {
      const updatePayload = updatedProjectOrFunction;
      console.log('Updating project from child (direct):', projectId, updatePayload);

      setProjects((prevProjects) =>
        prevProjects.map((p) => (p.id === projectId ? mergeProjectUpdate(p, updatePayload) : p))
      );
      return;
    }

    // For functional updates (from dashboard edits), do optimistic update + API call
    let updatedProject;
    let previousProjects;
    let taskUpdateMeta;

    setProjects((prevProjects) => {
      previousProjects = [...prevProjects];
      const currentProject = prevProjects.find((p) => p.id === projectId);
      
      if (!currentProject) {
        console.warn('Project not found:', projectId);
        return prevProjects;
      }

      updatedProject = updatedProjectOrFunction(currentProject);
      console.log('Updating project (functional):', projectId, updatedProject);

      if (updatedProject?.__taskUpdate) {
        taskUpdateMeta = updatedProject.__taskUpdate;
        delete updatedProject.__taskUpdate;
        if (updatedProject.changedTaskIds) {
          delete updatedProject.changedTaskIds;
        }
      }

      return prevProjects.map((p) => (p.id === projectId ? updatedProject : p));
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    if (!updatedProject) {
      console.error('Failed to capture updated project');
      return;
    }

    try {
      let serverUpdate;

      if (taskUpdateMeta?.taskId) {
        const response = await fetch(`/api/projects/${projectId}/tasks/${taskUpdateMeta.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskUpdateMeta.updates || {}),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          throw new Error("Failed to update task");
        }

        serverUpdate = await response.json();
      } else {
        const payload = prepareProjectPayload(updatedProject);

        const response = await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          throw new Error("Failed to update project");
        }

        serverUpdate = await response.json();
      }
      console.log('Server response:', serverUpdate);

      setProjects((prevProjects) =>
        prevProjects.map((p) => (p.id === projectId ? mergeProjectUpdate(p, serverUpdate) : p))
      );
    } catch (e) {
      console.error("Error updating project:", e);
      if (previousProjects) {
        setProjects(previousProjects);
      }
      showToast("Failed to update project. Please try again.", "error");
    }
  }, [showToast]);

  // Save project order to server
  const saveProjectOrder = async (projectIds) => {
    setIsSavingOrder(true);
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
      showToast("Failed to save project order", "error");
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Create stable callback references using Map to avoid re-creating on each render
  const projectUpdateCallbacks = useRef(new Map());
  const projectDeleteCallbacks = useRef(new Map());

  // Get or create memoized update callback for a specific project
  const getUpdateCallback = useCallback((projectId) => {
    // Clear the map to avoid stale closures when updateProject changes
    if (!projectUpdateCallbacks.current.has(projectId)) {
      projectUpdateCallbacks.current.set(projectId, (updatedProject) => {
        updateProject(projectId, updatedProject);
      });
    }
    return projectUpdateCallbacks.current.get(projectId);
  }, [updateProject]);

  // Clear callbacks when updateProject changes to avoid stale closures
  useEffect(() => {
    projectUpdateCallbacks.current.clear();
  }, [updateProject]);

  // Get or create memoized delete callback for a specific project
  const getDeleteCallback = useCallback((projectId) => {
    if (!projectDeleteCallbacks.current.has(projectId)) {
      projectDeleteCallbacks.current.set(projectId, () => {
        deleteProject(projectId);
      });
    }
    return projectDeleteCallbacks.current.get(projectId);
  }, [deleteProject]);

  // Clear callbacks when deleteProject changes to avoid stale closures
  useEffect(() => {
    projectDeleteCallbacks.current.clear();
  }, [deleteProject]);

  // Drag and drop handlers for reordering projects
  const handleDragStart = (e, projectId) => {
    setDraggedProjectId(projectId);
    setSortBy("custom"); // Switch to custom order when manually reordering
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, projectId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (projectId && projectId !== draggedProjectId) {
      setDragOverProjectId(projectId);
    }
  };

  const handleDragLeave = () => {
    setDragOverProjectId(null);
  };

  // Helper function to sort projects based on current sort option - MEMOIZED for performance
  const getSortedProjects = useMemo(() => {
    const projectsCopy = [...projects];
    
    switch (sortBy) {
      case "custom":
        return projectsCopy.sort((a, b) => {
          const orderA = a.display_order ?? 999999;
          const orderB = b.display_order ?? 999999;
          return orderA - orderB;
        });
      
      case "deadline":
        return projectsCopy.sort((a, b) => {
          const getDaysUntilTarget = (targetDate) => {
            if (!targetDate) return Infinity;
            const target = new Date(targetDate);
            const today = new Date();
            const diffTime = target - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
          };
          const daysA = getDaysUntilTarget(a.target_date);
          const daysB = getDaysUntilTarget(b.target_date);
          return daysA - daysB;
        });
      
      case "alpha":
        return projectsCopy.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      
      case "completion":
        return projectsCopy.sort((a, b) => {
          const getCompletionPercentage = (project) => {
            if (project.tasks.length === 0) return 0;
            const completed = project.tasks.filter(t => t.status === "Completed").length;
            return (completed / project.tasks.length) * 100;
          };
          return getCompletionPercentage(b) - getCompletionPercentage(a);
        });
      
      default:
        return projectsCopy;
    }
  }, [projects, sortBy]);

  const handleDrop = async (e, targetProjectId) => {
    e.preventDefault();
    setDragOverProjectId(null);

    if (draggedProjectId === targetProjectId) {
      setDraggedProjectId(null);
      return;
    }

    // Work with the current sorted array to get correct indices
    const currentProjects = getSortedProjects;
    const draggedIndex = currentProjects.findIndex((p) => p.id === draggedProjectId);
    const targetIndex = currentProjects.findIndex((p) => p.id === targetProjectId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedProjectId(null);
      return;
    }

    // Capture positions before reorder (FLIP: First)
    const beforePositions = {};
    currentProjects.forEach((project) => {
      const el = projectRefs.current[project.id];
      if (el) {
        const rect = el.getBoundingClientRect();
        beforePositions[project.id] = { left: rect.left, top: rect.top };
      }
    });

    // Reorder projects array
    const newProjects = [...currentProjects];
    const [removed] = newProjects.splice(draggedIndex, 1);
    newProjects.splice(targetIndex, 0, removed);

    // Update display_order for each project to reflect new positions
    const projectsWithUpdatedOrder = newProjects.map((project, index) => ({
      ...project,
      display_order: index
    }));

    // Update state with new order
    setProjects(projectsWithUpdatedOrder);

    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      // Capture positions after reorder (FLIP: Last)
      projectsWithUpdatedOrder.forEach((project) => {
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
              el.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
              el.style.transform = "translate(0, 0)";
            });
          }
        }
      });

      // Clean up after animation
      setTimeout(() => {
        projectsWithUpdatedOrder.forEach((project) => {
          const el = projectRefs.current[project.id];
          if (el) {
            el.style.transition = "";
            el.style.transform = "";
          }
        });
        setDraggedProjectId(null);
      }, 300);
    });

    // Save the new order to the server
    await saveProjectOrder(projectsWithUpdatedOrder.map((p) => p.id));
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
    setDragOverProjectId(null);
  };

  const calculateOverallProgress = () => {
    if (projects.length === 0) return 0;
    const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = projects.reduce(
      (sum, p) => sum + p.tasks.filter((t) => t.status === "Completed").length,
      0
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const getProjectsReadyForDeploy = () => {
    return projects.filter((p) => {
      const requiredTasks = p.tasks.filter((t) => t.required);
      const completedRequired = requiredTasks.filter(
        (t) => t.status === "Completed"
      );
      return (
        requiredTasks.length > 0 &&
        requiredTasks.length === completedRequired.length
      );
    }).length;
  };

  const overallProgress = calculateOverallProgress();
  const readyForDeploy = getProjectsReadyForDeploy();
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === "Completed").length,
    0
  );

  // Sort projects based on selected sort option - using memoized value
  const sortedProjects = getSortedProjects;

  const getSortLabel = () => {
    switch (sortBy) {
      case "custom": return "Custom Order";
      case "deadline": return "Deadline (Soonest First)";
      case "alpha": return "Alphabetical";
      case "completion": return "Completion %";
      default: return "Custom Order";
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <main className="flex-1 min-h-screen">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="mx-auto px-6 py-4">
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/table"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Table View
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
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
        </div>
      </header>

      <div className="mx-auto px-6 py-8">
        {/* Enhanced Stats Cards with Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Projects
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {projects.length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 text-blue-500 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Active deployments
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Overall Progress
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {overallProgress}%
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
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
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Ready to Deploy
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {readyForDeploy}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 text-purple-500 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              All tasks complete
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Tasks Completed
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {completedTasks}
                  <span className="text-xl text-gray-400">/{totalTasks}</span>
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width:
                    totalTasks > 0
                      ? `${(completedTasks / totalTasks) * 100}%`
                      : "0%",
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600">
                Manage your deployment projects
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Project
              </button>
              <Link
                href="/table"
                className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-all border-2 border-gray-300 hover:border-gray-400 flex items-center gap-2"
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
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Table View
              </Link>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border-2 border-dashed border-gray-300 p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No projects yet
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                Get started by creating your first deployment project and start
                tracking your production checklist
              </p>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-3 text-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Your First Project
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Your Projects ({projects.length})
              </h2>
              <div className="flex items-center gap-3">
                {isSavingOrder && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving order...
                  </div>
                )}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="custom">🎯 Custom Order</option>
                    <option value="deadline">📅 By Deadline</option>
                    <option value="alpha">🔤 Alphabetical</option>
                    <option value="completion">📊 By Completion</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            {sortBy === "custom" && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-800">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Drag & drop</strong> projects to reorder them. Your custom order will be saved automatically.</span>
              </div>
            )}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {sortedProjects.map((project) => {
                const isDragging = draggedProjectId === project.id;
                const isDragOver = dragOverProjectId === project.id;
                
                return (
                  <div
                    key={project.id}
                    ref={(el) => projectRefs.current[project.id] = el}
                    draggable={sortBy === "custom" && !isAnyModalOpen}
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    onDragOver={(e) => handleDragOver(e, project.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, project.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all ${
                      sortBy === "custom" && !isAnyModalOpen ? "cursor-grab active:cursor-grabbing" : ""
                    } ${
                      isDragging ? "opacity-50 scale-95" : ""
                    } ${
                      isDragOver ? "scale-105 ring-4 ring-blue-400 ring-opacity-50" : ""
                    }`}
                  >
                    <ProjectChecklist
                      project={project}
                      onUpdate={getUpdateCallback(project.id)}
                      onDelete={getDeleteCallback(project.id)}
                      onModalStateChange={setIsAnyModalOpen}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      <CreateProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreate={addProject}
      />

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
