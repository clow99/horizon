# Multiple Task Operations Fix

## Problem

When attempting to delete or add multiple tasks in quick succession in the Table View, the following issues occurred:

1. **State Synchronization Error**: After deleting/adding one task, attempting to delete/add a second task would show the error: "Failed to update project. Please refresh the page."
2. **Stale Data**: The operation logic was using a stale reference to the projects array, causing subsequent operations to work with outdated data.
3. **UI Issues**: The Cancel and Remove buttons were not properly styled or positioned.
4. **No Protection**: Could click multiple "add" or "delete" buttons simultaneously, causing race conditions.

## Root Cause Analysis

### The State Problem

The issue occurred because of how React closures work with props:

```javascript
// ❌ PROBLEM: Using stale props
const confirmTaskRemoval = async () => {
  const { projectId, taskName } = deleteConfirmation;
  const project = projects.find(p => p.id === projectId);  // 🔴 Stale data!
  // ...
}
```

**What was happening:**

1. User clicks delete on Task A → Optimistic update happens in `TableClient`
2. User clicks delete on Task B before Task A finishes
3. Task B's deletion function still references the OLD `projects` array (before Task A was removed)
4. Task B tries to send the old project data (including Task A) to the server
5. Server rejects because the state doesn't match → Error message appears

### Why It Was Stale

- `TableView` receives `projects` as a prop
- When `confirmTaskRemoval` is defined, it captures the current `projects` value in its closure
- After the first delete, `TableClient` updates its state, but `TableView`'s closure still has the old reference
- React doesn't re-create the function until the component re-renders

## Solution Implemented

### 1. Functional State Updates

Changed from using stale props to using functional updates that always work with the latest state:

```javascript
// ✅ SOLUTION: Use functional update
const confirmTaskRemoval = async () => {
  if (!deleteConfirmation || isDeletingTask) return;
  
  const { projectId, taskName } = deleteConfirmation;
  
  // Use functional update - gets LATEST project state
  await onUpdateProject(projectId, (currentProject) => {
    // This currentProject is guaranteed to be the most recent version
    const updatedTasks = currentProject.tasks.filter(task => task.name !== taskName);
    return { ...currentProject, tasks: updatedTasks };
  });
}
```

**Benefits:**
- Always works with the current state from `TableClient`
- No stale data references
- Safe for rapid consecutive operations

### 2. Deletion Locking

Added a global lock to prevent multiple simultaneous deletions:

```javascript
const [isDeletingTask, setIsDeletingTask] = useState(false);

const initiateTaskRemoval = (projectId, taskName) => {
  if (isDeletingTask) return; // 🔒 Prevent new deletions
  setDeleteConfirmation({ projectId, taskName });
};

const confirmTaskRemoval = async () => {
  if (isDeletingTask) return;
  setIsDeletingTask(true); // 🔒 Lock
  
  try {
    // ... deletion logic ...
  } finally {
    setIsDeletingTask(false); // 🔓 Unlock
  }
}
```

**Benefits:**
- Only one deletion can happen at a time
- Prevents race conditions
- Clear visual feedback (buttons disable during deletion)
- No conflicting server requests

### 3. Task Addition Locking

Added per-task locking to prevent duplicate additions:

```javascript
const [addingTasks, setAddingTasks] = useState(new Set());

const addMissingTask = async (projectId, taskTemplate) => {
  const taskKey = `${projectId}-${taskTemplate.name}`;
  
  // Prevent adding the same task multiple times concurrently
  if (addingTasks.has(taskKey)) {
    return; // 🔒 Already adding this task
  }
  
  setAddingTasks(prev => new Set([...prev, taskKey])); // 🔒 Lock
  
  try {
    await onUpdateProject(projectId, (currentProject) => {
      // Double-check task doesn't already exist
      const taskExists = currentProject.tasks.some(t => t.name === taskTemplate.name);
      if (taskExists) {
        return currentProject; // Skip if already added
      }
      
      // Add the task
      const updatedTasks = [...currentProject.tasks, newTask];
      return { ...currentProject, tasks: updatedTasks };
    });
  } finally {
    setAddingTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskKey); // 🔓 Unlock
      return newSet;
    });
  }
}
```

**Benefits:**
- Prevents duplicate task additions
- Each task can be added independently (no global lock)
- Shows "⟳ adding..." feedback during operation
- Gracefully handles rapid clicks on same button

### 4. UI Improvements

**Button Styling:**
- Reduced padding: `px-2 py-1` (from `px-3 py-1.5`)
- Smaller font: `text-[10px]` (from `text-xs`)
- Removed `flex-1` to prevent stretching
- Smaller border radius

**Button Positioning:**
- Changed from `justify-center` to `justify-end`
- Buttons now align to the right side of the cell
- Better visual hierarchy

**Add Button Feedback:**
```javascript
<button
  onClick={() => addMissingTask(project.id, taskTemplate)}
  disabled={isUpdating || isAdding}
  title={isAdding ? "Adding task..." : "Add this task to project"}
>
  {isAdding ? '⟳ adding...' : '+ add'}
</button>
```

**Loading State:**
```javascript
{isDeletingTask && isUpdating ? (
  <span className="flex items-center gap-1">
    <span className="inline-block w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></span>
    Removing...
  </span>
) : (
  '✓ Remove'
)}
```

**Disabled States:**
- Delete buttons (✕) disabled while any deletion is in progress
- Cancel button disabled during deletion
- Add buttons show "⟳ adding..." while task is being added
- Tooltip updates to show operation status

### 5. Consistent Pattern Applied

The same functional update pattern was applied to other operations:

**addMissingTask:**
```javascript
await onUpdateProject(projectId, (currentProject) => {
  const newTask = { /* ... */ };
  const updatedTasks = [...currentProject.tasks, newTask];
  return { ...currentProject, tasks: updatedTasks };
});
```

## Technical Details

### How Functional Updates Work

In `TableClient.js`:

```javascript
const updateProject = async (projectId, updatedProjectOrFunction) => {
  let updatedProject;
  
  if (typeof updatedProjectOrFunction === 'function') {
    // Functional update - use latest state
    setProjects(prevProjects => {
      const currentProject = prevProjects.find(p => p.id === projectId);
      updatedProject = updatedProjectOrFunction(currentProject); // Call function with current state
      return prevProjects.map(p => p.id === projectId ? updatedProject : p);
    });
  } else {
    // Direct object update
    updatedProject = updatedProjectOrFunction;
    setProjects(prevProjects =>
      prevProjects.map(p => p.id === projectId ? updatedProject : p)
    );
  }
  
  // Send to server...
}
```

### State Flow Diagram

```
User clicks Delete (Task A)
    ↓
initiateTaskRemoval() → setDeleteConfirmation()
    ↓
User clicks "✓ Remove"
    ↓
confirmTaskRemoval()
    ↓
setIsDeletingTask(true) 🔒 LOCK
    ↓
onUpdateProject(projectId, (currentProject) => {...})
    ↓
TableClient: setProjects(prevProjects => {...}) ← Gets LATEST state
    ↓
Optimistic UI Update (instant)
    ↓
API call to server
    ↓
Success/Error handling
    ↓
setIsDeletingTask(false) 🔓 UNLOCK
    ↓
setDeleteConfirmation(null)
    ↓
Ready for next deletion
```

## Results

### Before Fix
- ❌ Could only delete one task before page refresh required
- ❌ Could only add one task before page refresh required
- ❌ "Failed to update project" error on second operation
- ❌ Stale state caused data inconsistencies
- ❌ Could click buttons multiple times creating duplicates
- ⚠️ Buttons too large and centered

### After Fix
- ✅ Can delete multiple tasks sequentially without errors
- ✅ Can add multiple tasks sequentially without errors
- ✅ Each operation uses the most current state
- ✅ Locking prevents race conditions and conflicts
- ✅ Clear visual feedback during operations
- ✅ Properly sized and positioned buttons
- ✅ Add button shows "⟳ adding..." during operation
- ✅ No page refresh needed
- ✅ Duplicate protection for task additions

## Testing

To verify the fix:

1. **Multiple Sequential Deletions:**
   - Navigate to Table View
   - Click delete (✕) on Task A → Click Remove
   - Wait for completion (spinner shows)
   - Click delete (✕) on Task B → Click Remove
   - Both tasks should delete successfully without errors

2. **Multiple Sequential Additions:**
   - Navigate to Table View
   - Find a task that's missing from a project (shows "+ add")
   - Click "+ add" on Project A
   - Wait for "⟳ adding..." to complete
   - Click "+ add" on Project B
   - Both tasks should be added successfully without errors

3. **Rapid Click Protection (Delete):**
   - Click delete (✕) on Task A
   - Try clicking delete (✕) on Task B while Task A is deleting
   - Button should be disabled with tooltip "Another deletion in progress"

4. **Rapid Click Protection (Add):**
   - Click "+ add" on a task
   - Try clicking "+ add" again immediately
   - Button should show "⟳ adding..." and be disabled
   - Prevents duplicate additions

5. **Cancel During Deletion:**
   - Click delete (✕) on a task
   - Click "✓ Remove" to start deletion
   - Cancel button should disable during the deletion process

6. **Visual Feedback:**
   - Remove button should show spinner and "Removing..." text during deletion
   - Add button should show "⟳ adding..." during addition
   - Buttons should align to the right side of the cell
   - Buttons should be compact and not stretch

## Best Practices Learned

1. **Always use functional updates** when state depends on previous state
2. **Implement locking mechanisms** for operations that should be sequential
3. **Provide clear visual feedback** for async operations
4. **Disable UI elements** during processing to prevent user confusion
5. **Use closures carefully** - be aware of what values are captured

## Related Files

- `src/components/TableView.js` - Main component with deletion logic
- `src/components/TableClient.js` - State management with functional updates
- `src/app/api/projects/[id]/route.js` - Server-side deletion endpoint
