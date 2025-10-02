# Task Order Stability Fix

## Issue

When reordering projects in the table view, the tasks (rows) were also reordering. This was confusing and disruptive - users expect the task list to remain stable while only the project columns move.

## Root Cause

The task list was being generated based on **first appearance order** across projects:

```javascript
// OLD CODE - Tasks ordered by first project encountered
const allUniqueTaskNames = useMemo(() => {
  const taskMap = new Map();
  const taskOrder = [];
  
  projects.forEach(project => {  // Loop through projects in order
    project.tasks.forEach(task => {
      if (!taskMap.has(task.name)) {
        taskOrder.push(task.name);  // First project wins
      }
    });
  });
  
  return taskOrder.map(name => taskMap.get(name));
}, [projects]);
```

**Problem:**
- If Project A had tasks [Setup, Deploy, Test]
- And Project B had tasks [Test, Setup, Monitor]
- Initial order: Setup (from A), Deploy (from A), Test (from A), Monitor (from B)
- After moving Project B first: Test (from B), Setup (from B), Monitor (from B), Deploy (from A)
- **The task rows completely reordered!**

## Solution

**Use stable, project-independent sorting** based on task database IDs:

```javascript
// NEW CODE - Tasks sorted by stable ID
const allUniqueTaskNames = useMemo(() => {
  const taskMap = new Map();
  
  // Collect all unique tasks
  projects.forEach(project => {
    project.tasks.forEach(task => {
      if (!taskMap.has(task.name)) {
        taskMap.set(task.name, {
          name: task.name,
          description: task.description,
          category: task.category,
          required: task.required,
          id: task.id  // Capture database ID
        });
      }
    });
  });
  
  // Convert to array and sort by ID (stable across all projects)
  const tasksArray = Array.from(taskMap.values());
  tasksArray.sort((a, b) => {
    if (a.id && b.id) {
      return a.id.localeCompare(b.id);  // Sort by database ID
    }
    return a.name.localeCompare(b.name);  // Fallback to name
  });
  
  return tasksArray;
}, [projects]);
```

## Benefits

### Before Fix
- ❌ Tasks reorder when projects reorder
- ❌ Confusing user experience
- ❌ Hard to track which task you were looking at
- ❌ Rows jumping around
- ❌ Task order depends on project order

### After Fix
- ✅ Tasks stay in same order
- ✅ Only project columns move
- ✅ Clear, predictable behavior
- ✅ Stable rows
- ✅ Task order independent of project order

## How It Works

### Stable Sorting Logic

1. **Collect all unique tasks** from all projects (no duplicates)
2. **Sort by database ID** (UUID string comparison)
   - Database IDs are assigned when tasks are created
   - They don't change
   - They're unique and sortable
3. **Fallback to task name** if ID not available
4. **Result**: Same task order every time, regardless of project order

### Example

**Initial State:**
```
Projects: [A, B, C]
Task IDs: {
  "Setup": "uuid-001",
  "Deploy": "uuid-002", 
  "Test": "uuid-003",
  "Monitor": "uuid-004"
}

Task order (sorted by ID):
1. Setup (uuid-001)
2. Deploy (uuid-002)
3. Test (uuid-003)
4. Monitor (uuid-004)
```

**After Reordering Projects to [C, A, B]:**
```
Task order (still sorted by ID):
1. Setup (uuid-001)    ← Same position
2. Deploy (uuid-002)   ← Same position
3. Test (uuid-003)     ← Same position
4. Monitor (uuid-004)  ← Same position

Only the project COLUMNS moved, rows stayed stable!
```

## Edge Cases Handled

### 1. Missing IDs
If a task doesn't have an ID (shouldn't happen, but defensive):
- Falls back to sorting by task name alphabetically
- Still provides stable sort

### 2. Same Task Name in Multiple Projects
- Task map uses task name as key (no duplicates)
- First instance's metadata is used
- All projects see same task row

### 3. New Tasks Added
- New task gets new database ID
- Inserted in sorted position based on ID
- Doesn't disrupt existing task order

### 4. Tasks Deleted
- Task removed from all projects
- Doesn't affect order of remaining tasks

## Testing

✅ Reorder projects left/right → Tasks stay in same rows
✅ Move first project to last → Tasks don't move
✅ Move last project to first → Tasks don't move  
✅ Add new project → Existing task order preserved
✅ Delete project → Task order unchanged
✅ Filter by category → Filtered tasks maintain relative order
✅ Change pagination → Task order consistent across pages

## Files Changed

- ✅ `src/components/TableView.js` - Updated `allUniqueTaskNames` useMemo to sort by ID

## Related Issues

This complements:
- PROJECT_REORDER_FIX.md - Enabled project reordering
- INSTANT_CHECKBOX_FIX.md - Made checkboxes responsive
- STATE_MANAGEMENT_FIX.md - Simplified state management

## User Experience Impact

**Before:**
```
User: "I want to move Project B to the front"
*drags Project B*
Result: All tasks jump around randomly
User: "Wait, where did my tasks go? This is confusing!"
```

**After:**
```
User: "I want to move Project B to the front"  
*drags Project B*
Result: Project B column moves, all tasks stay in place
User: "Perfect! That's exactly what I expected."
```

## Alternative Approaches Considered

### 1. Manual Task Ordering
- Let users manually set task order
- Too complex, adds UI overhead
- Not necessary for most use cases

### 2. Order by Task Name
- Simple, alphabetical
- But not intuitive (users expect creation order)
- Chosen as fallback only

### 3. Order by First Project
- Original implementation
- Problem: Tasks reorder with projects
- Rejected

### 4. Order by Database ID (Chosen)
- ✅ Stable
- ✅ Reflects creation order
- ✅ No UI changes needed
- ✅ Simple to implement
- ✅ Predictable behavior

## Future Enhancements

Possible improvements:
- Add manual task reordering (drag tasks up/down)
- Save custom task order per user
- Group tasks by category with custom order per group
- Pin favorite tasks to top
