"use client";
import { useState, useRef, memo } from "react";
import { prepareProjectPayload } from "@/lib/client/prepareProjectPayload";
import { PROJECT_TYPES } from "@/config/projectTypes";

const statusOptions = [
  { value: "Not Started", label: "Not Started", color: "gray" },
  { value: "In Progress", label: "In Progress", color: "blue" },
  { value: "Completed", label: "Completed", color: "green" },
  { value: "Blocked", label: "Blocked", color: "red" },
];

const categoryColors = {
  Infrastructure:
    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  Security:
    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700",
  Monitoring:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700",
  DevOps:
    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700",
  Testing:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",
  Marketing:
    "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700",
  Legal:
    "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700",
  Deployment:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700",
};

function ProjectChecklist({ project, onUpdate, onDelete, onModalStateChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCardMenu, setShowCardMenu] = useState(false); // Dropdown on card
  const [showModalMenu, setShowModalMenu] = useState(false); // Dropdown in modal
  const [deleteProjectConfirmation, setDeleteProjectConfirmation] =
    useState(false);
  const [deleteTaskConfirmation, setDeleteTaskConfirmation] = useState(null); // taskId or null
  const [editFormData, setEditFormData] = useState({
    name: project.name || "",
    description: project.description || "",
    client: project.client || "",
    target_date: project.target_date || "",
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showNotesFor, setShowNotesFor] = useState(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [showMenuFor, setShowMenuFor] = useState(null); // Track which task's menu is open
  const [optimisticTaskUpdates, setOptimisticTaskUpdates] = useState({}); // Track optimistic task status updates
  const optimisticTaskUpdatesRef = useRef({});
  const optimisticUpdateVersionRef = useRef({});
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    category: "Infrastructure",
    status: "Not Started",
  });

  // Helper to update modal state and notify parent
  const updateModalState = (isOpen) => {
    setIsModalOpen(isOpen);
    if (onModalStateChange) {
      onModalStateChange(isOpen);
    }
  };

  // Open edit modal and sync form data
  const openEditModal = () => {
    setEditFormData({
      name: project.name || "",
      description: project.description || "",
      client: project.client || "",
      target_date: project.target_date || "",
    });
    setIsEditModalOpen(true);
    setShowCardMenu(false);
    setShowModalMenu(false);
  };

  // Save edit changes
  const saveEditChanges = () => {
    onUpdate((currentProject) => ({
      ...currentProject,
      ...editFormData,
    }));
    setIsEditModalOpen(false);
  };

  // Cancel edit
  const cancelEdit = () => {
    setIsEditModalOpen(false);
    setEditFormData({
      name: project.name || "",
      description: project.description || "",
      client: project.client || "",
      target_date: project.target_date || "",
    });
  };

  // Handle delete
  const handleDelete = () => {
    setDeleteProjectConfirmation(true);
  };

  const confirmDelete = () => {
    onDelete();
    setDeleteProjectConfirmation(false);
    setIsModalOpen(false);
  };

  const addNewTask = () => {
    if (!newTask.name.trim()) return;

    const taskToAdd = {
      id: `custom-${Date.now()}`,
      ...newTask,
      required: false,
      notes: "",
    };

    // Use functional update
    onUpdate((currentProject) => ({
      ...currentProject,
      tasks: [...currentProject.tasks, taskToAdd],
    }));

    setNewTask({
      name: "",
      description: "",
      category: "Infrastructure",
      status: "Not Started",
    });
    setShowAddTaskForm(false);
  };

  const deleteTask = (taskId) => {
    setDeleteTaskConfirmation(taskId);
  };

  const confirmDeleteTask = () => {
    if (deleteTaskConfirmation) {
      // Use functional update
      onUpdate((currentProject) => ({
        ...currentProject,
        tasks: currentProject.tasks.filter(
          (task) => task.id !== deleteTaskConfirmation
        ),
      }));
      setDeleteTaskConfirmation(null);
    }
  };

  const updateTask = async (taskId, updates, options = {}) => {
    const useTaskEndpoint = options.useTaskEndpoint === true;
    const currentVersion =
      (optimisticUpdateVersionRef.current[taskId] || 0) + 1;
    optimisticUpdateVersionRef.current[taskId] = currentVersion;

    const nextOptimisticUpdates = {
      ...optimisticTaskUpdatesRef.current,
      [taskId]: { ...updates },
    };

    optimisticTaskUpdatesRef.current = nextOptimisticUpdates;
    setOptimisticTaskUpdates(nextOptimisticUpdates);

    const updatedTasks = project.tasks.map((task) => {
      const optimisticUpdate = nextOptimisticUpdates[task.id];
      if (optimisticUpdate) {
        return { ...task, ...optimisticUpdate };
      }
      return task;
    });

    const targetTask = updatedTasks.find((task) => task.id === taskId);
    const persistedTaskId =
      targetTask?.id && !String(targetTask.id).startsWith("custom-");

    const updatedProject = {
      ...project,
      tasks: updatedTasks,
    };

    if (updatedProject.changedTaskIds) {
      delete updatedProject.changedTaskIds;
    }
    if (updatedProject.__taskUpdate) {
      delete updatedProject.__taskUpdate;
    }

    if (targetTask?.id) {
      if (useTaskEndpoint && persistedTaskId) {
        updatedProject.__taskUpdate = {
          taskId: targetTask.id,
          updates: { ...updates },
        };
      } else {
        updatedProject.changedTaskIds = [targetTask.id];
      }
    }

    try {
      let serverUpdate;

      if (useTaskEndpoint && persistedTaskId && targetTask?.id) {
        const response = await fetch(
          `/api/projects/${project.id}/tasks/${targetTask.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error:", errorText);
          throw new Error("Failed to update task status");
        }

        serverUpdate = await response.json();
      } else {
        const payload = prepareProjectPayload(updatedProject);
        const response = await fetch(`/api/projects/${project.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to update task");
        }

        serverUpdate = await response.json();
      }

      // Filter out stale task updates that have newer optimistic versions pending
      let filteredUpdate = serverUpdate;
      if (Array.isArray(serverUpdate?.updatedTasks)) {
        const filteredTasks = serverUpdate.updatedTasks.filter((task) => {
          if (!task?.id) return true;
          const pendingVersion = optimisticUpdateVersionRef.current[task.id];
          return (
            pendingVersion === undefined || pendingVersion <= currentVersion
          );
        });

        if (filteredTasks.length !== serverUpdate.updatedTasks.length) {
          filteredUpdate = { ...serverUpdate, updatedTasks: filteredTasks };
        }

        if (filteredTasks.length === 0) {
          filteredUpdate = { ...filteredUpdate };
          delete filteredUpdate.updatedTasks;
        }
      }

      // Clear optimistic update for this specific task only if it's still the latest version
      if (optimisticUpdateVersionRef.current[taskId] === currentVersion) {
        const remaining = { ...optimisticTaskUpdatesRef.current };
        delete remaining[taskId];
        optimisticTaskUpdatesRef.current = remaining;
        delete optimisticUpdateVersionRef.current[taskId];
        setOptimisticTaskUpdates(remaining);
      }

      const hasTaskUpdates =
        Array.isArray(filteredUpdate?.updatedTasks) &&
        filteredUpdate.updatedTasks.length > 0;
      const hasDeletedTasks =
        Array.isArray(filteredUpdate?.deletedTaskIds) &&
        filteredUpdate.deletedTaskIds.length > 0;
      const hasProjectUpdate =
        filteredUpdate?.project &&
        Object.keys(filteredUpdate.project).length > 0;

      if (hasTaskUpdates || hasDeletedTasks || hasProjectUpdate) {
        // Update parent state with server response
        onUpdate(filteredUpdate);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      // Rollback optimistic update on error if still current
      if (optimisticUpdateVersionRef.current[taskId] === currentVersion) {
        const remaining = { ...optimisticTaskUpdatesRef.current };
        delete remaining[taskId];
        optimisticTaskUpdatesRef.current = remaining;
        delete optimisticUpdateVersionRef.current[taskId];
        setOptimisticTaskUpdates(remaining);
      }
      // Could show a toast notification here
    }
  };

  // Helper to get task with optimistic updates applied
  const getTaskWithOptimisticUpdate = (task) => {
    if (optimisticTaskUpdates[task.id]) {
      return { ...task, ...optimisticTaskUpdates[task.id] };
    }
    return task;
  };

  // Apply optimistic updates to all tasks for rendering
  const tasksWithOptimisticUpdates = project.tasks.map(
    getTaskWithOptimisticUpdate
  );

  const completedTasks = tasksWithOptimisticUpdates.filter(
    (t) => t.status === "Completed"
  ).length;
  const blockedTasks = tasksWithOptimisticUpdates.filter(
    (t) => t.status === "Blocked"
  ).length;
  const totalTasks = tasksWithOptimisticUpdates.length;
  // Count completed + blocked as "done" for percentage calculation
  const doneTasks = completedTasks + blockedTasks;
  const progressPercentage =
    totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

  const categories = [
    ...new Set(tasksWithOptimisticUpdates.map((t) => t.category)),
  ];
  const filteredTasks =
    selectedCategory === "all"
      ? tasksWithOptimisticUpdates
      : tasksWithOptimisticUpdates.filter(
          (t) => t.category === selectedCategory
        );

  const getDaysUntilTarget = () => {
    if (!project.target_date) return null;
    const target = new Date(project.target_date);
    const today = new Date();
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilTarget = getDaysUntilTarget();

  return (
    <>
      {/* Project Card - Clickable to open modal */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 relative group"
        data-testid={`project-card-${project.id}`}
      >
        {/* Template Badge - Top right */}
        {project.project_type && PROJECT_TYPES[project.project_type] && (
          <div className="absolute top-3 right-14 z-10 pointer-events-none">
            <div
              className="text-xs px-2.5 py-1 rounded-md bg-blue-500/90 backdrop-blur-sm border border-blue-400/50 text-white flex items-center gap-1.5 shadow-md font-medium"
              title={`Template: ${PROJECT_TYPES[project.project_type].name}`}
            >
              <span>{PROJECT_TYPES[project.project_type].icon}</span>
              <span>
                {PROJECT_TYPES[project.project_type].name.split(" ")[0]}
              </span>
            </div>
          </div>
        )}

        {/* 3-Dot Menu on Card */}
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCardMenu(!showCardMenu);
            }}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white transition-colors"
            title="Project Options"
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showCardMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowCardMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateModalState(true);
                    setShowCardMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
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
                  View Tasks
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Project
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCardMenu(false);
                    handleDelete();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Project
                </button>
              </div>
            </>
          )}
        </div>

        {/* Project Header - Clickable */}
        <div
          onClick={() => updateModalState(true)}
          className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="text-white p-2">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {project.name}
                </h2>

                <p className="text-sm text-gray-300">
                  {project.description || "No description"}
                </p>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-blue-300 text-sm">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>{project.client || "No client"}</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
                      daysUntilTarget === null
                        ? "bg-gray-500 text-white"
                        : daysUntilTarget < 0
                        ? "bg-red-500 text-white"
                        : daysUntilTarget < 7
                        ? "bg-yellow-500 text-gray-900"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {daysUntilTarget === null
                        ? "No target date"
                        : daysUntilTarget < 0
                        ? `${Math.abs(daysUntilTarget)} days overdue`
                        : `${daysUntilTarget} days left`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Overall Progress</span>
              <span
                className="text-white font-semibold"
                data-testid="project-progress-value"
              >
                {completedTasks} / {totalTasks} tasks (
                {Math.round(progressPercentage)}%)
                {blockedTasks > 0 && (
                  <span className="text-red-400 ml-2">
                    ({blockedTasks} blocked)
                  </span>
                )}
              </span>
            </div>
            <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Task Details */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => updateModalState(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {project.name}
                </h2>
                <div className="flex items-center gap-2">
                  {/* 3-Dot Dropdown Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowModalMenu(!showModalMenu);
                      }}
                      className="text-white hover:bg-slate-700 rounded-lg p-2 transition-colors"
                      title="Project Options"
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
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showModalMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowModalMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal();
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit Project
                          </button>
                          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowModalMenu(false);
                              handleDelete();
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete Project
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => updateModalState(false)}
                    className="text-white hover:bg-slate-700 rounded-lg p-2 transition-colors"
                    title="Close"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(90vh-88px)]">
              <div className="p-6">
                {/* Add Task Button */}
                <div className="mb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddTaskForm(!showAddTaskForm);
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Custom Task
                  </button>
                </div>

                {/* Add Task Form */}
                {showAddTaskForm && (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-4">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                      Add New Task
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Task Name *
                        </label>
                        <input
                          type="text"
                          value={newTask.name}
                          onChange={(e) =>
                            setNewTask({ ...newTask, name: e.target.value })
                          }
                          placeholder="e.g., Configure CDN"
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Description
                        </label>
                        <textarea
                          value={newTask.description}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              description: e.target.value,
                            })
                          }
                          placeholder="Detailed description of the task..."
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                          rows="2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Category
                          </label>
                          <select
                            value={newTask.category}
                            onChange={(e) =>
                              setNewTask({
                                ...newTask,
                                category: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
                          >
                            {Object.keys(categoryColors).map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Status
                          </label>
                          <select
                            value={newTask.status}
                            onChange={(e) =>
                              setNewTask({ ...newTask, status: e.target.value })
                            }
                            className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setShowAddTaskForm(false)}
                          className="flex-1 px-3 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addNewTask}
                          disabled={!newTask.name.trim()}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Add Task
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Filter */}
                <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      selectedCategory === "all"
                        ? "bg-slate-900 dark:bg-slate-700 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    All Tasks ({tasksWithOptimisticUpdates.length})
                  </button>
                  {categories.map((category) => {
                    const count = tasksWithOptimisticUpdates.filter(
                      (t) => t.category === category
                    ).length;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
                          selectedCategory === category
                            ? categoryColors[category]
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                      >
                        {category} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Tasks Table */}
                <div className="space-y-1.5 w-full">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <svg
                        className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-3"
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
                      <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                        No tasks yet
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                        Add your first task to get started
                      </p>
                      <button
                        onClick={() => setShowAddTaskForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add Task
                      </button>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div key={task.id} className="group">
                        <div
                          className={`flex items-start gap-2 p-2.5 rounded-lg border transition-all ${
                            task.status === "Completed"
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                              : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm"
                          }`}
                        >
                          {/* Left Column: Checkbox and Info Icon */}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            {/* Custom Styled Checkbox */}
                            <label className="cursor-pointer group/checkbox relative">
                              <input
                                type="checkbox"
                                checked={task.status === "Completed"}
                                readOnly
                                disabled={task.status === "Blocked"}
                                className="sr-only peer"
                              />
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Prevent checking/unchecking if blocked
                                  if (task.status !== "Blocked") {
                                    const isCompleted =
                                      task.status !== "Completed";
                                    updateTask(
                                      task.id,
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
                                    ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400"
                                } ${
                                  task.status === "Blocked"
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
                            </label>
                          </div>

                          {/* Task Info */}
                          <div className="w-full">
                            <div className="flex items-center gap-1.5">
                              <h4
                                className={`text-sm font-medium leading-tight ${
                                  task.status === "Completed"
                                    ? "line-through text-gray-500 dark:text-gray-400"
                                    : "text-gray-900 dark:text-white"
                                }`}
                              >
                                {task.name}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug mt-0.5">
                              {task.description}
                            </p>
                          </div>

                          {/* Category Badge */}
                          <div
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${
                              categoryColors[task.category]
                            }`}
                          >
                            {task.category}
                          </div>

                          {/* Status Dropdown */}
                          <select
                            value={task.status}
                            onChange={(e) => {
                              const nextStatus = e.target.value;
                              const statusUpdates = { status: nextStatus };
                              statusUpdates.completed_at =
                                nextStatus === "Completed"
                                  ? new Date().toISOString()
                                  : null;
                              updateTask(task.id, statusUpdates, {
                                useTaskEndpoint: true,
                              });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-xs min-w-[120px] flex-shrink-0 [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white ${
                              task.status === "Completed"
                                ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
                                : task.status === "In Progress"
                                ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300"
                                : task.status === "Blocked"
                                ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
                                : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          {/* Action Menu Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowMenuFor(
                                  showMenuFor === task.id ? null : task.id
                                )
                              }
                              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors w-full"
                              title="More actions"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showMenuFor === task.id && (
                              <>
                                {/* Backdrop to close menu when clicking outside */}
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowMenuFor(null)}
                                />
                                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                                  <button
                                    onClick={() => {
                                      setShowNotesFor(
                                        showNotesFor === task.id
                                          ? null
                                          : task.id
                                      );
                                      setShowMenuFor(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                  >
                                    <svg
                                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                    {task.notes ? "Edit Notes" : "Add Notes"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      // TODO: Add edit task functionality
                                      setShowMenuFor(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                  >
                                    <svg
                                      className="w-4 h-4 text-gray-600 dark:text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                      />
                                    </svg>
                                    Edit Task
                                  </button>
                                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                  <button
                                    onClick={() => {
                                      deleteTask(task.id);
                                      setShowMenuFor(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    Delete Task
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Notes Section */}
                        {showNotesFor === task.id && (
                          <div className="ml-8 mr-2 mt-1.5 mb-2">
                            <textarea
                              value={task.notes}
                              onChange={(e) =>
                                updateTask(task.id, { notes: e.target.value })
                              }
                              placeholder="Add notes, assignee, or additional details..."
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-xs resize-none"
                              rows="3"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={cancelEdit}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edit Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Project</h2>
                <button
                  onClick={cancelEdit}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  title="Close"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Edit Modal Body */}
            <div className="p-6 space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                  placeholder="Enter project name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-white dark:bg-gray-700"
                  placeholder="Enter project description"
                  rows="3"
                />
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client
                </label>
                <input
                  type="text"
                  value={editFormData.client}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, client: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700"
                  placeholder="Enter client name"
                />
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  value={editFormData.target_date}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      target_date: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Edit Modal Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={cancelEdit}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveEditChanges}
                disabled={!editFormData.name.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {deleteProjectConfirmation && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200"
          onClick={() => setDeleteProjectConfirmation(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Delete Project
                  </h3>
                  <p className="text-red-100 text-sm mt-0.5">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  "{project.name}"
                </span>
                ?
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm">
                    <p className="font-semibold text-red-800 dark:text-red-300 mb-1">
                      Warning
                    </p>
                    <ul className="text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                      <li>All project data will be permanently deleted</li>
                      <li>
                        All {project.tasks.length} tasks and their progress will
                        be lost
                      </li>
                      <li>This action cannot be reversed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex gap-3">
              <button
                onClick={() => setDeleteProjectConfirmation(false)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {deleteTaskConfirmation && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200"
          onClick={() => setDeleteTaskConfirmation(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 rounded-t-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Delete Task</h3>
                  <p className="text-orange-100 text-sm mt-0.5">
                    Remove from project checklist
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete this task from{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  "{project.name}"
                </span>
                ?
              </p>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm">
                    <p className="font-semibold text-orange-800 dark:text-orange-300 mb-1">
                      Note
                    </p>
                    <p className="text-orange-700 dark:text-orange-400">
                      The task and its progress will be permanently removed from
                      this project.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex gap-3">
              <button
                onClick={() => setDeleteTaskConfirmation(null)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTask}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Memoize to prevent re-renders when parent state changes but props haven't
export default memo(ProjectChecklist);
