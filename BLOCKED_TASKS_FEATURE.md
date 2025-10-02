# Blocked Tasks Checkbox Behavior

## Overview

Tasks with status "Blocked" now have disabled checkboxes that cannot be checked, preventing them from being marked as completed until the blockage is resolved.

## Visual Changes

### Blocked Task Checkbox
When a task's status is set to "Blocked":
- ✅ Checkbox becomes **disabled** (cannot be clicked)
- ✅ Checkbox shows a **warning icon** (⚠️ triangle with exclamation)
- ✅ Background changes to **red tint** (`bg-red-100`)
- ✅ Border changes to **red** (`border-red-300`)
- ✅ Cursor changes to **not-allowed** icon
- ✅ Tooltip shows: **"Cannot complete blocked tasks"**

### Visual States

```
Not Started:    [ ] White checkbox, clickable
In Progress:    [ ] White checkbox, clickable
Blocked:        [⚠️] Red-tinted checkbox, DISABLED, warning icon
Completed:      [✓] Blue checkbox, clickable (can uncheck)
```

## Behavior

### When Task is Blocked
1. **Checkbox click does nothing** - The `onClick` handler checks for blocked status
2. **Visual feedback** - Red styling clearly indicates it's not available
3. **Tooltip guidance** - Hover shows "Cannot complete blocked tasks"
4. **Status dropdown still works** - You can change from "Blocked" to another status

### Workflow
```
User wants to mark task complete
    ↓
Is task blocked? 
    ↓ YES → Checkbox disabled, shows warning icon
    ↓        User must change status from "Blocked" first
    ↓        via the status dropdown
    ↓
    ↓ NO → Checkbox clickable, can mark complete
```

## Use Cases

### Scenario 1: Task is Blocked
- **Problem**: Need SSL certificate from client, but client hasn't provided it yet
- **Action**: Set status to "Blocked" in dropdown
- **Result**: Checkbox becomes unclickable with warning icon
- **Resolution**: When client provides certificate, change status back to "In Progress" or "Not Started"
- **Then**: Checkbox becomes clickable again

### Scenario 2: Accidental Block
- Task is accidentally set to "Blocked"
- Checkbox is disabled
- User uses dropdown to change status to "In Progress"
- Checkbox immediately becomes clickable again

### Scenario 3: Visual Clarity
- At a glance, red warning icons show which tasks have blockers
- Team knows these need attention before they can be completed
- No confusion about why some checkboxes "don't work"

## Technical Implementation

### Code Changes in `TableView.js`

#### 1. Checkbox Input Disabled State
```javascript
<input
  type="checkbox"
  checked={task.status === 'Completed'}
  readOnly
  disabled={isUpdating || task.status === 'Blocked'} // Added blocked check
  className="sr-only peer"
/>
```

#### 2. Click Handler Prevention
```javascript
onClick={(e) => {
  e.stopPropagation();
  // Prevent checking/unchecking if blocked or updating
  if (!isUpdating && task.status !== 'Blocked') {
    const isCompleted = task.status !== 'Completed';
    updateTaskInProject(project.id, task.name, {
      status: isCompleted ? 'Completed' : 'Not Started',
      completed_at: isCompleted ? new Date().toISOString() : null
    });
  }
}}
```

#### 3. Conditional Styling
```javascript
className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
  task.status === 'Completed'
    ? 'bg-blue-600 border-blue-600'
    : task.status === 'Blocked'
    ? 'bg-red-100 border-red-300 cursor-not-allowed' // Red styling for blocked
    : 'bg-white border-gray-300 hover:border-blue-500'
} ${isUpdating ? 'opacity-50 cursor-not-allowed' : task.status === 'Blocked' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
```

#### 4. Warning Icon Display
```javascript
{task.status === 'Blocked' && (
  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)}
```

#### 5. Tooltip
```javascript
title={task.status === 'Blocked' ? 'Cannot complete blocked tasks' : ''}
```

## Benefits

✅ **Prevents Invalid States** - Can't mark a blocked task as completed
✅ **Clear Visual Feedback** - Red styling and warning icon make blockers obvious
✅ **Intuitive UX** - Disabled checkbox with explanation tooltip
✅ **Forces Resolution** - Must address the blocker (change status) before completing
✅ **Consistent Behavior** - Matches real-world workflow where blocked tasks can't be finished
✅ **Easy Recovery** - Just change status dropdown back to continue work

## Status Flow Chart

```
┌─────────────┐
│ Not Started │ ◄─── Can check/uncheck
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ In Progress │ ◄─── Can check/uncheck
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Blocked   │ ◄─── ❌ CANNOT check (disabled)
└──────┬──────┘      Must change status first
       │
       │ (must change status via dropdown)
       │
       ▼
┌─────────────┐
│  Completed  │ ◄─── Can uncheck to revert
└─────────────┘
```

## Related Files

- **Modified**: `src/components/TableView.js` (Lines ~917-957)
- **Status Options**: Defined at top of `TableView.js`
  - Not Started
  - In Progress
  - Blocked ← This one disables checkbox
  - Completed

## Testing

### Test Cases

1. **Set task to Blocked**
   - Change status dropdown to "Blocked"
   - Verify checkbox shows warning icon
   - Verify checkbox is red-tinted
   - Try clicking checkbox → Nothing happens
   - Hover over checkbox → See "Cannot complete blocked tasks"

2. **Unblock task**
   - Change status from "Blocked" to "In Progress"
   - Verify checkbox becomes clickable again
   - Click checkbox → Task marks as completed

3. **Multiple blocked tasks**
   - Set several tasks to "Blocked"
   - Verify all show warning icons
   - All should be unclickable
   - Change one back → Only that one becomes clickable

---

This feature ensures your workflow accurately reflects real-world blockers and prevents tasks from being incorrectly marked as complete when they're actually stuck! 🚫✅
