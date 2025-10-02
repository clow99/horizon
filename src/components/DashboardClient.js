"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProjectChecklist from "@/components/ProjectChecklist";
import Toast from "@/components/Toast";
import Link from "next/link";
import { createProjectTasks } from "@/config/tasks";

export default function DashboardClient({ initialProjects, session }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [useDefaultTasks, setUseDefaultTasks] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const showToast = (message, type = "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addProject = async (includeDefaults = true) => {
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
      tasks: includeDefaults ? createProjectTasks() : [],
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

  const deleteProject = async (projectId) => {
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
  };

  const updateProject = async (projectId, updatedProjectOrFunction) => {
    // ALWAYS do optimistic update IMMEDIATELY
    let updatedProject;

    if (typeof updatedProjectOrFunction === "function") {
      // Functional update - get latest state
      setProjects((prevProjects) => {
        const currentProject = prevProjects.find((p) => p.id === projectId);
        if (!currentProject) return prevProjects;

        updatedProject = updatedProjectOrFunction(currentProject);
        return prevProjects.map((p) =>
          p.id === projectId ? updatedProject : p
        );
      });
    } else {
      // Direct object update
      updatedProject = updatedProjectOrFunction;
      const previousProjects = [...projects];
      setProjects((prevProjects) =>
        prevProjects.map((p) => (p.id === projectId ? updatedProject : p))
      );
    }

    if (!updatedProject) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) throw new Error("Failed to update project");

      // Don't update with server response - optimistic update is sufficient
      // This prevents flickering and reordering issues
      router.refresh();
    } catch (e) {
      console.error("Error updating project:", e);
      // On error, just show toast - user can refresh to get server state
      showToast("Failed to update project. Please refresh the page.", "error");
    }
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

  // Sort projects by days left (ascending - soonest deadline first)
  const sortedProjects = [...projects].sort((a, b) => {
    const getDaysUntilTarget = (targetDate) => {
      if (!targetDate) return Infinity; // Projects without target date go to the end
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                    Production Tracker
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
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="w-8 h-8 rounded-full border-2 border-blue-500 shadow-md"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {session.user.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Sign Out
              </button>
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
              <div className="text-sm text-gray-600">
                Sorted by deadline (soonest first)
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {sortedProjects.map((project) => (
                <ProjectChecklist
                  key={project.id}
                  project={project}
                  onUpdate={(updatedProject) =>
                    updateProject(project.id, updatedProject)
                  }
                  onDelete={() => deleteProject(project.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Create New Project
                </h2>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700 mb-4">
                    Choose how you want to start your project:
                  </p>

                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-all border ${
                        useDefaultTasks
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="taskOption"
                        checked={useDefaultTasks}
                        onChange={() => setUseDefaultTasks(true)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          With Default Tasks
                        </div>
                        <div className="text-xs text-gray-500">
                          Start with pre-configured checklist
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-all border ${
                        !useDefaultTasks
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="taskOption"
                        checked={!useDefaultTasks}
                        onChange={() => setUseDefaultTasks(false)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          Empty Project
                        </div>
                        <div className="text-xs text-gray-500">
                          Start from scratch with custom tasks
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
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
      {toasts.map((toast) => (
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
