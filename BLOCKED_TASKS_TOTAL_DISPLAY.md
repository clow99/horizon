# Blocked Tasks in Total Column

## Overview

The Total column now treats blocked tasks specially in its display, showing the completed count out of the non-blocked total, with color coding to indicate when tasks are blocked.

## Visual Display

### Examples

**No Blocked Tasks:**
```
3/5
└─ 3 completed (green)
   5 total (gray)
```

**With Blocked Tasks (2 blocked, 3 completed, 5 total):**
```
3/3
└─ 3 completed (green)
   3 non-blocked total (red) ← 5 total - 2 blocked = 3
```

**Another Example (1 completed, 2 blocked, 5 total):**
```
1/3
└─ 1 completed (green)
   3 non-blocked total (red) ← 5 total - 2 blocked = 3
```

## How It Works

### Calculation Logic

```javascript
const stats = {
  total: 5,           // Total tasks across all projects
  completed: 3,       // Tasks marked as completed
  blocked: 2,         // Tasks marked as blocked
  done: 5,            // completed + blocked (for percentage)
  percentage: 100%    // (completed + blocked) / total * 100
};

// Display shows:
// completed / (total - blocked)
// 3 / (5 - 2) = 3/3
```

### Color Coding

**Completed Number (First Number):**
- Always **green** (`text-green-600`)
- Shows count of completed tasks

**Total Number (Second Number):**
- **Red** (`text-red-600`) if there are any blocked tasks
- **Gray** (`text-gray-600`) if no blocked tasks
- Shows total minus blocked tasks (available tasks to complete)

### Percentage Calculation

The percentage includes both completed AND blocked tasks as "done":

```
Percentage = (completed + blocked) / total * 100
```

**Why?** Because blocked tasks are accounted for but not completable, they contribute to progress toward having all tasks addressed.

## Use Cases

### Scenario 1: All Tasks Completable
- **5 total tasks**
- **3 completed**
- **0 blocked**
- **Display:** `3/5` (green/gray)
- **Percentage:** 60%

### Scenario 2: Some Tasks Blocked
- **5 total tasks**
- **3 completed**
- **2 blocked**
- **Display:** `3/3` (green/red) ← Red indicates blocked tasks exist
- **Percentage:** 100% (all tasks are either completed or blocked)

### Scenario 3: Only Blocked Tasks
- **5 total tasks**
- **0 completed**
- **3 blocked**
- **Display:** `0/2` (green/red)
- **Percentage:** 60% (3 blocked out of 5 total)

## Visual Indicators

### What Red Denominator Means

When the second number is **red**, it tells you:
1. ❌ Some tasks are blocked
2. 📊 The number shown excludes blocked tasks
3. ⚠️ You have fewer completable tasks than total tasks
4. 🔓 Need to unblock tasks to increase available work

### Reading the Display

```
3/3 (red denominator)
│ │
│ └─ 3 tasks available to complete (some are blocked)
└─── 3 tasks completed

vs.

3/5 (gray denominator)
│ │
│ └─ 5 tasks available to complete (none blocked)
└─── 3 tasks completed
```

## Benefits

✅ **Clear Visual Signal** - Red number immediately shows blocked tasks exist
✅ **Realistic Progress** - Shows progress against completable tasks
✅ **Percentage Accuracy** - Percentage includes blocked as "addressed"
✅ **Quick Scanning** - Can quickly see which rows have blockers
✅ **Color Consistency** - Green = good (completed), Red = attention needed (blocked)

## Technical Implementation

### Stats Calculation
```javascript
const getTaskStats = (taskName) => {
  let total = 0;
  let completed = 0;
  let blocked = 0;
  
  projects.forEach(project => {
    const task = findTaskInProject(project, taskName);
    if (task) {
      total++;
      if (task.status === 'Completed') completed++;
      if (task.status === 'Blocked') blocked++;
    }
  });
  
  const done = completed + blocked;
  
  return { 
    total, 
    completed, 
    blocked,
    done,
    percentage: total > 0 ? (done / total) * 100 : 0 
  };
};
```

### Display Rendering
```javascript
<div className="text-[10px] flex items-center justify-center gap-0.5">
  <span className="text-green-600 font-semibold">{stats.completed}</span>
  <span className="text-gray-400">/</span>
  <span className={stats.blocked > 0 ? "text-red-600 font-semibold" : "text-gray-600"}>
    {stats.total - stats.blocked}
  </span>
</div>
```

## Examples Across Different States

| Total | Completed | Blocked | Display | Percentage | Meaning |
|-------|-----------|---------|---------|------------|---------|
| 5 | 3 | 0 | `3/5` (green/gray) | 60% | 3 done, 2 remaining |
| 5 | 3 | 2 | `3/3` (green/red) | 100% | All completable done, 2 blocked |
| 5 | 0 | 2 | `0/3` (green/red) | 40% | None complete, 2 blocked, 3 available |
| 5 | 5 | 0 | `5/5` (green/gray) | 100% | All complete! |
| 5 | 2 | 3 | `2/2` (green/red) | 100% | All completable done, 3 blocked |
| 5 | 1 | 4 | `1/1` (green/red) | 100% | Only 1 completable and it's done! |

## Color Legend

- 🟢 **Green number** = Completed tasks (success)
- 🔴 **Red number** = Denominator when blocked tasks exist (warning)
- ⚪ **Gray number** = Normal denominator with no blockers
- ⚪ **Gray slash** = Separator

## Related Features

This works in conjunction with:
- ✅ Blocked task checkboxes (disabled with ⚠️ icon)
- ✅ Percentage calculation (includes blocked as "done")
- ✅ Status dropdown (can change from blocked to unblock tasks)

## Files Modified

- **`src/components/TableView.js`** (Line ~457-475 and ~1025-1040)
  - Updated `getTaskStats` to track blocked count
  - Modified display to show `completed / (total - blocked)`
  - Added conditional red coloring when blocked > 0

---

This gives you instant visual feedback about task blockers in your deployment tracking! 🔴🟢
