# Custom Task Feature

## Overview

Added the ability to create and add custom tasks to projects directly from the table page. This feature allows users to define their own tasks beyond the default deployment checklist.

## Features

### 1. Add Custom Task Button

- Located in the filters section after the Display Mode toggle
- Styled with a gradient blue/indigo button for visibility
- Opens a modal dialog for task creation

### 2. Custom Task Modal

The modal includes the following fields:

#### Required Fields:

- **Task Name**: The name/title of the custom task
- **Category**: Select from predefined categories (Infrastructure, Security, Monitoring, DevOps, Testing, Marketing, Legal, Deployment)
- **Add to Projects**: Select one or more projects to add the task to

#### Optional Fields:

- **Description**: Detailed description of the task

### 3. Project Selection

- Displays all currently visible projects
- Pre-selects all visible projects by default
- Includes "Select All" and "Deselect All" buttons for convenience
- Shows the number of existing tasks for each project
- Displays count of selected projects

### 4. Multi-Project Support

- Add the same custom task to multiple projects simultaneously
- Each project will receive an independent copy of the task
- Tasks start with "Not Started" status by default

## How to Use

1. **Open the Table Page** (`/table`)
2. **Expand Filters** (if not already visible)
3. **Click "Add Custom Task"** button in the Custom Tasks section
4. **Fill in the form**:
   - Enter a task name (required)
   - Add a description (optional but recommended)
   - Select a category (defaults to Infrastructure)
   - Choose which projects should receive the task
5. **Click "Add Task"** to create the task

## Technical Details

### State Management

- `showCustomTaskModal`: Controls modal visibility
- `customTaskName`: Stores the task name input
- `customTaskDescription`: Stores the task description
- `customTaskCategory`: Stores selected category
- `selectedProjectsForTask`: Set of project IDs to add the task to
- `isAddingCustomTask`: Loading state during task creation

### Functions

- `openCustomTaskModal()`: Opens modal and pre-selects all visible projects
- `addCustomTask()`: Validates and adds the task to selected projects
- `toggleProjectForTask(projectId)`: Toggles project selection

### Validation

- Task name cannot be empty
- At least one project must be selected
- Duplicate prevention is handled by the existing `addMissingTask` function

## UI/UX Features

- **Backdrop blur**: Modal has a semi-transparent backdrop
- **Gradient header**: Blue to indigo gradient for visual appeal
- **Sticky header/footer**: Form content scrolls while header and footer remain visible
- **Disabled states**: All inputs and buttons disabled during task creation
- **Loading indicator**: Spinning icon shown during task addition
- **Keyboard accessible**: Can be closed with the X button or Cancel button

## Integration

The feature integrates seamlessly with existing functionality:

- Uses the existing `addMissingTask()` function to add tasks
- Respects the same task structure as default tasks
- Tasks appear immediately in the table after creation
- Works with all existing filters and grouping options
- Custom tasks can be updated, completed, and deleted like default tasks

## Future Enhancements

Possible improvements for future versions:

- Save custom task templates for reuse
- Import/export custom task lists
- Bulk edit custom tasks across projects
- Custom task categories
- Task dependencies
