"use client";
import { useState } from "react";
import { getProjectTypes, createTasksFromProjectType } from "@/config/projectTypes";

const categoryColors = {
  'Infrastructure': 'bg-blue-100 text-blue-700 border-blue-200',
  'Security': 'bg-red-100 text-red-700 border-red-200',
  'Monitoring': 'bg-purple-100 text-purple-700 border-purple-200',
  'DevOps': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Testing': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Marketing': 'bg-pink-100 text-pink-700 border-pink-200',
  'Legal': 'bg-orange-100 text-orange-700 border-orange-200',
  'Deployment': 'bg-green-100 text-green-700 border-green-200',
  'Features': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Documentation': 'bg-gray-100 text-gray-700 border-gray-200'
};

const statusOptions = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Blocked', label: 'Blocked' }
];

export default function CreateProjectModal({ isOpen, onClose, onCreate }) {
  const [step, setStep] = useState(1); // 1: Select Type, 2: Edit Tasks
  const [selectedType, setSelectedType] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    category: 'Infrastructure',
    status: 'Not Started',
    required: false
  });

  const projectTypes = getProjectTypes();

  const handleSelectType = (typeId) => {
    setSelectedType(typeId);
    const initialTasks = createTasksFromProjectType(typeId);
    setTasks(initialTasks);
    setStep(2);
  };

  const handleBackToTypes = () => {
    setStep(1);
    setSelectedType(null);
    setTasks([]);
    setEditingTaskId(null);
  };

  const handleAddTask = () => {
    if (!newTask.name.trim()) return;
    
    const taskToAdd = {
      id: `custom-${Date.now()}`,
      name: newTask.name,
      description: newTask.description,
      category: newTask.category,
      status: newTask.status,
      
      notes: ''
    };
    
    setTasks([...tasks, taskToAdd]);
    setNewTask({
      name: '',
      description: '',
      category: 'Infrastructure',
      status: 'Not Started',
      required: false
    });
    setShowAddTaskForm(false);
  };

  const handleUpdateTask = (taskId, updates) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleDeleteTask = (taskId) => {
    if (confirm('Are you sure you want to remove this task?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const handleCreate = () => {
    onCreate(selectedType, tasks);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    setTasks([]);
    setEditingTaskId(null);
    setShowAddTaskForm(false);
    setNewTask({
      name: '',
      description: '',
      category: 'Infrastructure',
      status: 'Not Started',
      required: false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {step === 1 ? 'Create New Project' : 'Customize Tasks'}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {step === 1 
                  ? 'Choose a project type to get started' 
                  : 'Add, edit, or remove tasks before creating your project'
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {step === 1 ? (
            // Step 1: Select Project Type
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleSelectType(type.id)}
                  className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left"
                >
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {type.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {type.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {type.tasks.length} preset tasks
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Step 2: Edit Tasks
            <div>
              {/* Add Task Button */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setShowAddTaskForm(!showAddTaskForm)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Task
                </button>
                <div className="text-sm text-gray-600">
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </div>
              </div>

              {/* Add Task Form */}
              {showAddTaskForm && (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                  <h3 className="text-base font-bold text-gray-900 mb-3">Add New Task</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Task Name *</label>
                      <input
                        type="text"
                        value={newTask.name}
                        onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                        placeholder="e.g., Configure CDN"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                      <textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        placeholder="Detailed description of the task..."
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        rows="2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                        <select
                          value={newTask.category}
                          onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          {Object.keys(categoryColors).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                        <select
                          value={newTask.status}
                          onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setShowAddTaskForm(false)}
                        className="flex-1 px-3 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddTask}
                        disabled={!newTask.name.trim()}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500 font-medium mb-2">No tasks yet</p>
                    <p className="text-gray-400 text-sm mb-4">Add tasks to your project checklist</p>
                    <button
                      onClick={() => setShowAddTaskForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Task
                    </button>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all"
                    >
                      {editingTaskId === task.id ? (
                        // Edit Mode
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Task Name</label>
                            <input
                              type="text"
                              value={task.name}
                              onChange={(e) => handleUpdateTask(task.id, { name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={task.description}
                              onChange={(e) => handleUpdateTask(task.id, { description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                              rows="2"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                              <select
                                value={task.category}
                                onChange={(e) => handleUpdateTask(task.id, { category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                {Object.keys(categoryColors).map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                              <select
                                value={task.status}
                                onChange={(e) => handleUpdateTask(task.id, { status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                {statusOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-gray-900">{task.name}</h4>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColors[task.category]}`}>
                                {task.category}
                              </span>
                              <span className="text-xs text-gray-500">
                                {task.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingTaskId(task.id)}
                              className="p-1.5 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              title="Edit task"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete task"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
          {step === 2 && (
            <button
              onClick={handleBackToTypes}
              className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          {step === 2 && (
            <button
              onClick={handleCreate}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
