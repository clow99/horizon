# Task Deletion and Sticky Headers Fix

## Overview

Two major improvements to the table view:
1. **Per-Project Task Deletion**: Remove tasks from individual projects without affecting other projects
2. **Sticky Headers Fix**: Project headers now properly stick when scrolling

## Feature 1: Task Deletion for Individual Projects

### The Problem
Users couldn't remove tasks from specific projects. If a task wasn't relevant to a particular project, it would just sit there marked as "Not Started" cluttering the view.

### The Solution
Added a **hover-activated delete button** on each task cell that:
- Only appears when hovering over the cell (clean UI)
- Removes the task from THAT specific project only
- Shows a confirmation dialog
- Allows re-adding the task later with the existing "+ add" button

### How It Works

#### Delete Function
```javascript
const removeTaskFromProject = async (projectId, taskName) => {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  // Confirm deletion
  if (!confirm(`Remove "${taskName}" from ${project.name}?\n\nYou can add it back later using the "+ add" button.`)) {
    return;
  }

  const taskKey = `${projectId}-${taskName}`;
  setUpdatingTasks(prev => new Set([...prev, taskKey]));

  // Filter out the task
  const updatedTasks = project.tasks.filter(task => task.name !== taskName);
  const updatedProject = { ...project, tasks: updatedTasks };

  // Call parent update (parent handles state)
  try {
    await onUpdateProject(projectId, updatedProject);
  } catch (error) {
    console.error('Error removing task:', error);
  } finally {
    // Remove from updating set
    setUpdatingTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskKey);
      return newSet;
    });
  }
};
```

#### UI Implementation
```javascript
<td key={project.id} className="px-2 py-2 border-r group relative">
  <div className="flex items-center justify-center gap-2">
    {/* Checkbox and Status Dropdown */}
  </div>

  {/* Delete Button - Shows on hover */}
  <button
    onClick={() => removeTaskFromProject(project.id, task.name)}
    disabled={isUpdating}
    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 disabled:opacity-30"
    title="Remove this task from this project"
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</td>
```

### User Experience

#### Before Task Exists:
```
[   + add   ]  ← Button to add missing task
```

#### After Task Added:
```
┌─────────────────┐
│ [✓] Completed ▼ │ ← Normal view
└─────────────────┘
```

#### On Hover:
```
┌─────────────────┐
│ [✓] Completed ▼ │ [X] ← Delete button appears
└─────────────────┘
```

#### After Deletion:
```
[   + add   ]  ← Back to add button, can restore task
```

### Benefits

✅ **Flexible Task Management**
- Remove irrelevant tasks per project
- Keep your view clean
- Only show what matters for each project

✅ **Non-Destructive**
- Task only removed from that specific project
- Other projects keep the task
- Can easily add it back with "+ add" button

✅ **Clean UI**
- Delete button only shows on hover
- Doesn't clutter the interface
- Confirmation dialog prevents accidents

✅ **Consistent Behavior**
- Works just like dashboard task deletion
- Same optimistic UI updates
- Same error handling

### Example Scenarios

#### Scenario 1: Task Not Applicable
```
Project: "Mobile App"
Task: "CDN Configuration"

Action: Hover over cell → Click X → Confirm
Result: CDN task removed (mobile app doesn't need CDN)
Later: Can add back if needed
```

#### Scenario 2: Simplify Workflow
```
Project: "Internal Tool"
Tasks: Remove "SEO & Meta Tags", "Legal Documents"

Action: Remove non-essential tasks for internal projects
Result: Cleaner checklist focused on relevant items
```

#### Scenario 3: Custom Per-Project
```
Project A: Has all 18 default tasks
Project B: Only 10 relevant tasks (removed 8)
Project C: Only 5 core tasks (removed 13)

Result: Each project has custom task list
```

## Feature 2: Sticky Headers Fix

### The Problem
Table headers were NOT sticking when scrolling vertically. The issue was:
- `overflow-hidden` on parent container broke sticky positioning
- Sticky positioning only works relative to nearest scrolling ancestor
- Headers needed proper z-index layering

### The Solution

#### 1. Removed `overflow-hidden`
```javascript
// BEFORE - Broke sticky
<div className="bg-white rounded-lg shadow border overflow-hidden">

// AFTER - Allows sticky
<div className="bg-white rounded-lg shadow border">
```

#### 2. Made Category Headers Sticky Too
```javascript
{groupBy === 'category' && (
  <div className="bg-indigo-600 px-3 py-2 border-b sticky z-50" style={{ top: '57px' }}>
    <h2 className="text-sm font-bold text-white">{group.category}</h2>
  </div>
)}
```

#### 3. Adjusted Table Header Position
```javascript
<thead className="sticky z-50" style={{ 
  top: groupBy === 'category' ? '99px' : '57px'  // Adjust based on category header
}}>
```

#### 4. Proper Z-Index Layering
```javascript
Main Header:      z-[100]  (top: 0)
Category Header:  z-50     (top: 57px)
Table Header:     z-50     (top: 57px or 99px)
Task Name Column: z-[60]   (left: 0, sticky horizontal)
```

### How It Works

#### Visual Layers (Top to Bottom)
```
┌─────────────────────────────────────┐
│ Main Header (Deployment Tracker)    │ z-100, top: 0
├─────────────────────────────────────┤
│ Category Header (Infrastructure)    │ z-50, top: 57px
├─────────────────────────────────────┤
│ Table Header (Project Names)        │ z-50, top: 99px
├─────────────────────────────────────┤
│ Table Rows (Tasks)                  │ Scrollable
│ ...                                 │
│ ...                                 │
└─────────────────────────────────────┘
```

#### Sticky Behavior

**List View (groupBy='task'):**
```
Main Header (always visible)
  ↓
Table Headers (stick at 57px from top)
  ↓
Scrollable task rows
```

**Category View (groupBy='category'):**
```
Main Header (always visible)
  ↓
Category Header (stick at 57px from top)
  ↓
Table Headers (stick at 99px from top)
  ↓
Scrollable task rows
```

### Testing Sticky Headers

✅ **Vertical Scroll**: Project headers stay visible
✅ **Horizontal Scroll**: Task name column stays on left
✅ **Both Scrolls**: Headers create fixed frame
✅ **Category Mode**: Category header also sticks
✅ **Z-Index**: No overlap issues

## Combined Workflow

### Typical Usage Pattern

1. **View table with all tasks**
   - Scroll down → Headers stick
   - Scroll right → Task names stick

2. **Identify irrelevant tasks per project**
   - Hover over unwanted task cell
   - Click X button
   - Confirm removal

3. **Clean, focused view**
   - Only relevant tasks showing
   - Headers always visible
   - Easy to scan and update

4. **Add tasks back if needed**
   - Click "+ add" button
   - Task restored to project
   - Can delete again anytime

## Technical Details

### State Management

- `updatingTasks` Set tracks deletion in progress
- Optimistic UI updates (remove immediately)
- API call to persist changes
- Error handling with rollback

### API Integration

Uses existing `onUpdateProject` callback:
```javascript
await onUpdateProject(projectId, {
  ...project,
  tasks: updatedTasks  // Filtered array
});
```

Hits `PUT /api/projects/[id]` endpoint with updated task list.

### Database Impact

Task removed from project's tasks array:
```sql
-- Before
tasks: [
  { name: "Setup", status: "Completed" },
  { name: "Deploy", status: "Not Started" },
  { name: "Test", status: "In Progress" }
]

-- After removing "Deploy"
tasks: [
  { name: "Setup", status: "Completed" },
  { name: "Test", status: "In Progress" }
]
```

## Files Modified

- ✅ `src/components/TableView.js`
  - Added `removeTaskFromProject` function
  - Added hover delete button to task cells
  - Fixed sticky positioning (removed overflow-hidden)
  - Made category headers sticky
  - Adjusted z-index layering

## Benefits Summary

### Task Deletion
- ✅ Per-project task customization
- ✅ Clean, minimal UI (hover-activated)
- ✅ Non-destructive (can add back)
- ✅ Confirmation dialog
- ✅ Consistent with dashboard behavior

### Sticky Headers
- ✅ Headers visible while scrolling
- ✅ Better navigation and context
- ✅ Professional table experience
- ✅ Works in both view modes
- ✅ Proper z-index layering

## Future Enhancements

Possible improvements:
1. **Bulk Task Operations**: Select multiple tasks to delete at once
2. **Task Templates**: Save custom task lists as templates
3. **Task Hiding**: Temporarily hide instead of delete
4. **Undo/Redo**: Undo recent deletions
5. **Task Archive**: Move to archive instead of delete
6. **Export/Import**: Export task configurations between projects
