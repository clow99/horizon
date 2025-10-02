"use client";
import { useState } from 'react';

const statusOptions = [
  { value: 'Not Started', label: 'Not Started', color: 'gray' },
  { value: 'In Progress', label: 'In Progress', color: 'blue' },
  { value: 'Completed', label: 'Completed', color: 'green' },
  { value: 'Blocked', label: 'Blocked', color: 'red' }
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

export default function ProjectChecklist({ project, onUpdate, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNotesFor, setShowNotesFor] = useState(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [showMenuFor, setShowMenuFor] = useState(null); // Track which task's menu is open
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    category: 'Infrastructure',
    required: false,
    status: 'Not Started'
  });

  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue || '');
  };

  const finishEditing = (field) => {
    if (editingField === field) {
      // Use functional update
      onUpdate((currentProject) => ({
        ...currentProject,
        [field]: tempValue
      }));
      setEditingField(null);
      setTempValue('');
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue('');
  };

  const addNewTask = () => {
    if (!newTask.name.trim()) return;
    
    const taskToAdd = {
      id: `custom-${Date.now()}`,
      ...newTask,
      notes: ''
    };
    
    // Use functional update
    onUpdate((currentProject) => ({
      ...currentProject,
      tasks: [...currentProject.tasks, taskToAdd]
    }));
    
    setNewTask({
      name: '',
      description: '',
      category: 'Infrastructure',
      required: false,
      status: 'not-started'
    });
    setShowAddTaskForm(false);
  };

  const deleteTask = (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      // Use functional update
      onUpdate((currentProject) => ({
        ...currentProject,
        tasks: currentProject.tasks.filter(task => task.id !== taskId)
      }));
    }
  };

  const updateTask = (taskId, updates) => {
    // Use functional update to always work with latest project state
    onUpdate((currentProject) => ({
      ...currentProject,
      tasks: currentProject.tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    }));
  };

  const completedTasks = project.tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = project.tasks.length;
  const requiredTasks = project.tasks.filter(t => t.required);
  const completedRequired = requiredTasks.filter(t => t.status === 'Completed').length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isReadyToDeploy = requiredTasks.length > 0 && requiredTasks.length === completedRequired.length;

  const categories = [...new Set(project.tasks.map(t => t.category))];
  const filteredTasks = selectedCategory === 'all' 
    ? project.tasks 
    : project.tasks.filter(t => t.category === selectedCategory);

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
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:bg-slate-700 rounded-lg p-2 transition-colors mt-1"
            >
              <svg
                className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <div className="flex-1">
              {editingField === 'name' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEditing('name');
                      if (e.key === 'Escape') cancelEditing();
                    }}
                    className="bg-white text-gray-900 px-4 py-2 rounded-lg text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
                    autoFocus
                    placeholder="Project Name"
                  />
                  <button
                    onClick={() => finishEditing('name')}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                    title="Save"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h2
                    className="text-2xl font-bold text-white mb-2"
                  >
                    {project.name}
                  </h2>
                  <button
                    onClick={() => startEditing('name', project.name)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all p-1"
                    title="Edit name"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}
              
              {editingField === 'description' ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEditing('description');
                      if (e.key === 'Escape') cancelEditing();
                    }}
                    className="bg-white text-gray-900 px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
                    autoFocus
                    placeholder="Project description"
                  />
                  <button
                    onClick={() => finishEditing('description')}
                    className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-gray-500 hover:bg-gray-600 text-white p-1.5 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <p
                    className="text-gray-300 text-sm"
                  >
                    {project.description}
                  </p>
                  <button
                    onClick={() => startEditing('description', project.description)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all p-1"
                    title="Edit description"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3">
                {editingField === 'client' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEditing('client');
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      className="bg-white text-gray-900 px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      autoFocus
                      placeholder="Client name"
                    />
                    <button
                      onClick={() => finishEditing('client')}
                      className="bg-green-500 hover:bg-green-600 text-white p-1 rounded text-xs"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-500 hover:bg-gray-600 text-white p-1 rounded text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <div className="flex items-center gap-2 text-blue-300 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{project.client || 'No client'}</span>
                    </div>
                    <button
                      onClick={() => startEditing('client', project.client)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all p-1"
                      title="Edit client"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}

                {editingField === 'target_date' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEditing('target_date');
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      className="bg-white text-gray-900 px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      autoFocus
                    />
                    <button
                      onClick={() => finishEditing('target_date')}
                      className="bg-green-500 hover:bg-green-600 text-white p-1 rounded text-xs"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-500 hover:bg-gray-600 text-white p-1 rounded text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <div
                      className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
                        daysUntilTarget === null
                          ? 'bg-gray-500 text-white'
                          : daysUntilTarget < 0
                          ? 'bg-red-500 text-white'
                          : daysUntilTarget < 7
                          ? 'bg-yellow-500 text-gray-900'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {daysUntilTarget === null 
                          ? 'No target date'
                          : daysUntilTarget < 0 
                          ? `${Math.abs(daysUntilTarget)} days overdue`
                          : `${daysUntilTarget} days left`
                        }
                      </span>
                    </div>
                    <button
                      onClick={() => startEditing('target_date', project.target_date)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all p-1"
                      title="Edit target date"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isReadyToDeploy && (
              <div className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 animate-pulse">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ready to Deploy
              </div>
            )}
            <button
              onClick={onDelete}
              className="text-white hover:bg-red-500 rounded-lg p-2 transition-colors"
              title="Delete Project"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Overall Progress</span>
            <span className="text-white font-semibold">
              {completedTasks} / {totalTasks} tasks ({Math.round(progressPercentage)}%)
            </span>
          </div>
          <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Required Tasks</span>
            <span className={`font-semibold ${isReadyToDeploy ? 'text-green-400' : 'text-yellow-400'}`}>
              {completedRequired} / {requiredTasks.length} completed
            </span>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {isExpanded && (
        <div className="p-4">
          {/* Add Task Button */}
          <div className="mb-4">
            <button
              onClick={() => setShowAddTaskForm(!showAddTaskForm)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Custom Task
            </button>
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

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="required-task"
                    checked={newTask.required}
                    onChange={(e) => setNewTask({...newTask, required: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 accent-blue-600"
                  />
                  <label htmlFor="required-task" className="text-xs font-medium text-gray-700">
                    Mark as required for deployment
                  </label>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowAddTaskForm(false)}
                    className="flex-1 px-3 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
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
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Tasks ({project.tasks.length})
            </button>
            {categories.map(category => {
              const count = project.tasks.filter(t => t.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
                    selectedCategory === category
                      ? categoryColors[category]
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>

          {/* Tasks Table */}
          <div className="space-y-1.5">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 font-medium mb-2">No tasks yet</p>
                <p className="text-gray-400 text-sm mb-4">Add your first task to get started</p>
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
              filteredTasks.map((task) => (
              <div key={task.id} className="group">
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                    task.status === 'Completed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="flex items-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={task.status === 'Completed'}
                      onChange={(e) => updateTask(task.id, { 
                        status: e.target.checked ? 'Completed' : 'Not Started'
                      })}
                      className="w-5 h-5 text-blue-600 rounded-md focus:ring-2 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-sm font-medium leading-tight ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.name}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-snug mt-0.5">{task.description}</p>
                  </div>

                  {/* Category Badge */}
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${categoryColors[task.category]}`}>
                    {task.category}
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={task.status}
                    onChange={(e) => updateTask(task.id, { status: e.target.value })}
                    className={`px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-xs min-w-[120px] flex-shrink-0 ${
                      task.status === 'completed'
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : task.status === 'in-progress'
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : task.status === 'blocked'
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                        : 'bg-gray-100 border-gray-300 text-gray-800'
                    }`}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {/* Action Menu Dropdown */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setShowMenuFor(showMenuFor === task.id ? null : task.id)}
                      className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                      title="More actions"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
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
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => {
                              setShowNotesFor(showNotesFor === task.id ? null : task.id);
                              setShowMenuFor(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {task.notes ? 'Edit Notes' : 'Add Notes'}
                          </button>
                          <button
                            onClick={() => {
                              // TODO: Add edit task functionality
                              setShowMenuFor(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit Task
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={() => {
                              deleteTask(task.id);
                              setShowMenuFor(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                      onChange={(e) => updateTask(task.id, { notes: e.target.value })}
                      placeholder="Add notes, assignee, or additional details..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-xs resize-none"
                      rows="3"
                    />
                  </div>
                )}
              </div>
            ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
