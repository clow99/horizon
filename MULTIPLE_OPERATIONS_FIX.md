# Multiple Task Operations Fix

## Problem Summary

When attempting to **add or remove multiple tasks** in quick succession on the table screen, operations were failing with errors. This was caused by two separate but related issues:

### Issue 1: Stale State in React (Frontend)
- **Symptom**: Could not add/remove multiple tasks quickly
- **Root Cause**: The `updateTaskInProject` function in `TableView.js` was using the stale `projects` prop instead of getting the latest state
- **Status**: ✅ **FIXED**

### Issue 2: Missing Database Columns (Backend)
- **Symptom**: Database error: `Unknown column 'updated_by_user_id' in 'field list'`
- **Root Cause**: User tracking columns don't exist in the `tasks` table yet
- **Status**: ✅ **FIXED** (temporarily disabled user tracking)

---

## Technical Details

### Frontend Fix: Functional State Updates

**The Problem:**
```javascript
// ❌ OLD CODE - Uses stale props
const updateTaskInProject = async (projectId, taskName, updates) => {
  const project = projects.find(p => p.id === projectId);  // 🔴 Stale data!
  const updatedTasks = project.tasks.map(task =>
    task.name === taskName ? { ...task, ...updates } : task
  );
  const updatedProject = { ...project, tasks: updatedTasks };
  await onUpdateProject(projectId, updatedProject);
};
```

**What was happening:**
1. User clicks checkbox on Task A → Optimistic update happens
2. User immediately clicks checkbox on Task B
3. Task B's function still has the OLD projects array (before Task A was updated)
4. Task B tries to update using stale data
5. Server rejects the update → Error!

**The Solution:**
```javascript
// ✅ NEW CODE - Uses functional update
const updateTaskInProject = async (projectId, taskName, updates) => {
  await onUpdateProject(projectId, (currentProject) => {
    // Gets LATEST state from TableClient
    const updatedTasks = currentProject.tasks.map(task =>
      task.name === taskName ? { ...task, ...updates } : task
    );
    return { ...currentProject, tasks: updatedTasks };
  });
};
```

**Benefits:**
- ✅ Always works with the most current state
- ✅ Multiple rapid updates work correctly
- ✅ No race conditions or stale data
- ✅ Consistent with `addMissingTask` and `confirmTaskRemoval` which already used functional updates

### Backend Fix: Removed User Tracking (Temporary)

**The Problem:**
The API was trying to save user tracking data to columns that don't exist:
```sql
UPDATE tasks SET 
  name = ?, category = ?, status = ?, required = ?, notes = ?, completed_at = ?,
  updated_by_user_id = ?,        -- ❌ Column doesn't exist
  updated_by_user_name = ?,      -- ❌ Column doesn't exist  
  updated_by_user_image = ?      -- ❌ Column doesn't exist
WHERE id = ?
```

**The Solution (Temporary):**
```sql
-- Removed the user tracking columns from queries
UPDATE tasks SET 
  name = ?, category = ?, status = ?, required = ?, notes = ?, completed_at = ?
WHERE id = ?
```

---

## Files Modified

### 1. `src/components/TableView.js`
**Line ~159-188**: Changed `updateTaskInProject` to use functional updates

**Before:**
```javascript
const project = projects.find(p => p.id === projectId);
const updatedTasks = project.tasks.map(task =>
  task.name === taskName ? { ...task, ...updates } : task
);
const updatedProject = { ...project, tasks: updatedTasks };
await onUpdateProject(projectId, updatedProject);
```

**After:**
```javascript
await onUpdateProject(projectId, (currentProject) => {
  const updatedTasks = currentProject.tasks.map(task =>
    task.name === taskName ? { ...task, ...updates } : task
  );
  return { ...currentProject, tasks: updatedTasks };
});
```

### 2. `src/app/api/projects/[id]/route.js`
**Line ~76 & ~95**: Removed user tracking columns from SQL queries

**Before:**
```javascript
await query(
  'UPDATE tasks SET name = ?, category = ?, status = ?, required = ?, notes = ?, completed_at = ?, updated_by_user_id = ?, updated_by_user_name = ?, updated_by_user_image = ? WHERE id = ?',
  [task.name, task.category || null, task.status || 'Not Started', task.required || false, task.notes || null, completedAt, session.user.id, session.user.name || null, session.user.image || null, task.id]
);
```

**After:**
```javascript
await query(
  'UPDATE tasks SET name = ?, category = ?, status = ?, required = ?, notes = ?, completed_at = ? WHERE id = ?',
  [task.name, task.category || null, task.status || 'Not Started', task.required || false, task.notes || null, completedAt, task.id]
);
```

---

## How to Add User Tracking (Optional)

If you want to see profile pictures of who last updated each task, run this SQL:

### Option 1: Run the Migration Script
```powershell
node scripts/add-updated-by-tracking.js
```

### Option 2: Run SQL Manually
Connect to your MySQL database and run:

```sql
USE checklist;

-- Add the three new columns to track which user last updated each task
ALTER TABLE tasks 
ADD COLUMN updated_by_user_id VARCHAR(36) NULL COMMENT 'User who last updated this task' AFTER completed_at,
ADD COLUMN updated_by_user_name VARCHAR(255) NULL COMMENT 'Cached name of user who last updated' AFTER updated_by_user_id,
ADD COLUMN updated_by_user_image TEXT NULL COMMENT 'Cached profile image URL of user who last updated' AFTER updated_by_user_name,
ADD CONSTRAINT fk_tasks_updated_by_user 
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id) 
  ON DELETE SET NULL ON UPDATE CASCADE,
ADD INDEX idx_updated_by_user_id (updated_by_user_id);

-- Verify the columns were added
SHOW COLUMNS FROM tasks;
```

### Then Update the API Code

After adding the columns, restore the user tracking in `src/app/api/projects/[id]/route.js`:

**For UPDATE (line ~76):**
```javascript
await query(
  'UPDATE tasks SET name = ?, category = ?, status = ?, required = ?, notes = ?, completed_at = ?, updated_by_user_id = ?, updated_by_user_name = ?, updated_by_user_image = ? WHERE id = ?',
  [
    task.name,
    task.category || null,
    task.status || 'Not Started',
    task.required || false,
    task.notes || null,
    completedAt,
    session.user.id,
    session.user.name || null,
    session.user.image || null,
    task.id
  ]
);
```

**For INSERT (line ~95):**
```javascript
await query(
  'INSERT INTO tasks (id, project_id, name, category, status, required, notes, completed_at, updated_by_user_id, updated_by_user_name, updated_by_user_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [
    taskId,
    id,
    task.name,
    task.category || null,
    task.status || 'Not Started',
    task.required || false,
    task.notes || null,
    completedAt,
    session.user.id,
    session.user.name || null,
    session.user.image || null
  ]
);
```

---

## Testing

### Test Multiple Task Operations
1. Go to the table view
2. Quickly check multiple task checkboxes across different projects
3. Quickly uncheck multiple tasks
4. Add multiple tasks to different projects in succession
5. Remove multiple tasks quickly

**Expected Result:** All operations should work smoothly without errors.

### What Was Fixed
- ✅ Can now add multiple tasks rapidly
- ✅ Can now remove multiple tasks rapidly
- ✅ Can now toggle multiple checkboxes quickly
- ✅ No more "Failed to update project" errors
- ✅ No more database column errors
- ✅ UI updates instantly (optimistic updates)
- ✅ State stays synchronized

---

## Why Functional Updates Matter

React functional updates are crucial when:
1. **Multiple rapid state changes** happen
2. **State depends on previous state**
3. **Async operations** are involved
4. **Props might be stale** in closures

### The Pattern
```javascript
// ❌ BAD - Uses stale state
setState(oldValue + 1);

// ✅ GOOD - Always uses latest state
setState(currentValue => currentValue + 1);
```

This pattern ensures you're always working with the most recent state, not a stale closure value.

---

## Summary

The core issue was React closure capturing stale props. By switching to functional updates, we ensure:

1. **`updateTaskInProject`** → Now uses functional update ✅
2. **`addMissingTask`** → Already used functional update ✅
3. **`confirmTaskRemoval`** → Already used functional update ✅

All three critical functions now consistently use the latest state, making multiple rapid operations work correctly.

The database column issue was a separate problem that prevented the app from working at all. By temporarily removing the user tracking columns from the SQL queries, the app now works. You can add them back later when you're ready to run the migration.
