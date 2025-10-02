# Bulk Add Task Feature

## Overview

Added the ability to quickly add a task to all projects that are missing it, directly from the table view.

## How It Works

### Visual Indicator
When you hover over a task row in the table view, if some projects are missing that task, a **"Add to X"** button appears in the task name column.

### Button Appearance
- **Hidden by default** - Only shows on row hover
- **Shows count** - Displays how many projects are missing the task
- **Color-coded** - Blue styling to indicate it's an additive action
- **Icon** - Plus icon for clarity

### Behavior
When you click the **"Add to X"** button:
1. The task is added to ALL projects that don't currently have it
2. Each project update happens sequentially to avoid race conditions
3. Visual loading indicators show on each "+ add" cell as it processes
4. The button disappears once all projects have the task

## Example Scenarios

### Scenario 1: Removed a task from multiple projects
- You previously removed "SSL Certificate" from 3 out of 5 projects
- Hover over the "SSL Certificate" row
- Click **"Add to 3"** button
- Task is instantly added back to those 3 projects

### Scenario 2: New task needs to be tracked everywhere
- A task exists in only 1 project but should be tracked in all
- Hover over that task's row
- Click **"Add to 9"** (if you have 10 projects total)
- Task is now in all 10 projects

### Scenario 3: All projects already have the task
- No button appears because there's nothing to add

## Technical Implementation

### New Function: `addTaskToAllProjects`
```javascript
const addTaskToAllProjects = async (taskTemplate) => {
  // Find all projects missing this task
  const projectsMissingTask = projects.filter(project => 
    !project.tasks.some(task => task.name === taskTemplate.name)
  );

  // Add task to each project sequentially
  for (const project of projectsMissingTask) {
    await addMissingTask(project.id, taskTemplate);
  }
};
```

### UI Changes
- Added hover state to task rows (`group/row`)
- Button appears on hover with opacity transition
- Shows count of projects that will receive the task
- Disabled state while operations are in progress

## Benefits

✅ **Speed** - Add tasks to multiple projects with one click instead of clicking "+ add" on each cell individually

✅ **Convenience** - Especially useful when:
- You accidentally removed a task from multiple projects
- A new task needs to be tracked across all projects
- Standardizing tasks across your project portfolio

✅ **Visual Feedback** - Clear indication of how many projects will be affected

✅ **Safe** - Uses the same robust `addMissingTask` function that handles race conditions and prevents duplicates

## Files Modified

### `src/components/TableView.js`
- **Line ~272**: Added `addTaskToAllProjects` function
- **Line ~832**: Updated task row rendering to:
  - Calculate which projects are missing the task
  - Show bulk add button on hover when applicable
  - Display count of projects that will receive the task

## Usage Tips

1. **Hover to reveal** - The button only shows when hovering over a task row
2. **Check the count** - Make sure the number matches your expectations before clicking
3. **Wait for completion** - Watch the "+ add" buttons change as each project is updated
4. **Sequential processing** - Updates happen one at a time to ensure data integrity

## Related Features

- **Individual Add** - Still available via the "+ add" button in each project cell
- **Task Deletion** - Can remove tasks individually (with confirmation)
- **Task Filtering** - Only shows tasks that exist in at least one project

---

This feature makes managing tasks across multiple projects much more efficient! 🚀
