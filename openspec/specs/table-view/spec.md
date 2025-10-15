# Table View

## Purpose

Task-centric interface displaying projects as columns and tasks as rows in a spreadsheet-like layout. Optimized for batch processing the same task across multiple projects.

## Requirements

### Requirement: Spreadsheet Layout

Projects and Tasks SHALL be displayed in a spreadsheet-style matrix.

**ID**: `table-layout`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Display table structure

**Given** a user switches to Table View  
**Then** the interface shows:

- First column: Task names (with row numbers)
- Subsequent columns: One column per project
- Header row: Project information cards
- Cell content: Checkbox + status dropdown for each project-task combination

#### Scenario: Sticky headers and columns

**Given** the table has many projects and tasks  
**When** a user scrolls horizontally  
**Then** the task name column remains fixed (sticky)  
**When** a user scrolls vertically  
**Then** the project header row remains visible at the top

---

### Requirement: Project Column Headers

Each project column SHALL display comprehensive project information.

**ID**: `table-project-headers`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Project header content

**Given** a project is displayed as a column  
**Then** the header shows:

- Project number badge
- Full project name
- Project URL (if set)
- Visual progress bar
- Task completion count (X/Y completed)
- Archive button (on hover)

#### Scenario: Archive from table view

**Given** a user hovers over a project header  
**When** they click the archive icon  
**Then** the project is archived  
**And** the column disappears from the table  
**And** a toast notification confirms the action

---

### Requirement: Task Rows

Each row SHALL represent a unique task across all projects.

**ID**: `table-task-rows`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Display task row

**Given** multiple projects have a task named "SSL Certificate"  
**Then** one row is displayed for "SSL Certificate"  
**And** the row number is shown in the first column  
**And** each project column shows that project's instance of the task

#### Scenario: Row with missing task

**Given** a task exists in some projects but not others  
**When** displaying the task row  
**Then** projects without the task show an empty cell  
**And** only projects with the task show checkbox and status

#### Scenario: Alternating row colors

**Given** the table has multiple rows  
**Then** rows alternate background colors  
**And** this improves readability when scanning across many columns

---

### Requirement: Task Cell Interactions

Each cell SHALL allow direct task completion and status updates.

**ID**: `table-cell-interactions`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Toggle task completion in cell

**Given** a cell represents an incomplete task  
**When** a user clicks the checkbox in that cell  
**Then** the task is marked complete with optimistic update  
**And** the checkbox shows checked state immediately  
**And** an API call persists the change for that specific project-task

#### Scenario: Update task status in cell

**Given** a cell represents a task  
**When** a user selects a new status from the dropdown  
**Then** the status updates immediately  
**And** an API call updates that task in that project

#### Scenario: Large interactive controls

**Given** cells contain checkboxes and dropdowns  
**Then** controls are sized larger than standard for easy clicking  
**And** the checkbox and dropdown are clearly labeled  
**And** status is color-coded (green=complete, blue=in-progress, red=blocked)

---

### Requirement: Category Filtering

The system SHALL allow users to filter tasks by category to focus on specific work types.

**ID**: `table-filter-category`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Apply category filter

**Given** a user views the table with all tasks  
**When** they select a category from the filter dropdown  
**Then** only tasks in that category are shown as rows  
**And** all other Tasks SHALL be hidden  
**And** the filter applies across all project columns

#### Scenario: Clear category filter

**Given** a category filter is active  
**When** the user selects "All Categories"  
**Then** all Tasks SHALL be displayed again

---

### Requirement: Grouping Options

The system SHALL allow users to choose how Tasks SHALL be organized in rows.

**ID**: `table-grouping`  
**Priority**: Medium  
**Status**: Implemented

#### Scenario: Group by task name

**Given** the table is in "By Task" mode  
**Then** tasks with the same name are merged into one row  
**And** each project shows its instance of that task in the row

#### Scenario: Group by category

**Given** the table is in "By Category" mode  
**Then** Tasks SHALL be grouped by category  
**And** category headers separate different groups  
**And** tasks within each category are displayed together

---

### Requirement: Progress Statistics

The table SHALL show aggregate progress statistics for each task across all projects.

**ID**: `table-progress-stats`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Task completion percentage

**Given** a task row  
**Then** the rightmost column shows what percentage of projects have completed that task  
**And** the percentage updates in real-time as Tasks SHALL be checked

#### Scenario: Visual completion indicators

**Given** a task is 100% complete across all projects  
**Then** the row displays a green checkmark or other visual indicator  
**And** this helps identify which Tasks SHALL be fully done across all projects

---

### Requirement: Archive Toggle

The system SHALL allow users to view and restore archived projects from the table view.

**ID**: `table-archive-toggle`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Toggle to archived view

**Given** a user is viewing active projects  
**When** they click the "Active / Archived" toggle  
**Then** the table switches to show archived projects  
**And** active projects are hidden

#### Scenario: Restore archived project

**Given** a user is viewing archived projects  
**When** they hover over an archived project header  
**And** they click the restore button  
**Then** the project is unarchived  
**And** moves back to the active view

---

### Requirement: Batch Operations

The table view SHALL enable efficient batch processing of tasks.

**ID**: `table-batch-ops`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Complete task for multiple projects

**Given** a user needs to mark "SSL Certificate" as done for 5 projects  
**When** they locate the "SSL Certificate" row  
**Then** they can click the checkbox in each project column sequentially  
**And** each update happens immediately with optimistic UI  
**And** the user never leaves the context of that single task

#### Scenario: Horizontal workflow efficiency

**Given** a user works on one task type at a time  
**Then** the table view allows horizontal scanning and clicking  
**And** is more efficient than expanding/collapsing projects in dashboard view  
**And** is ideal for "I'm doing SSL certificates today" workflows

---

### Requirement: Navigation Between Views

The system SHALL allow users to switch between Dashboard and Table views easily.

**ID**: `table-navigation`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Switch to table view

**Given** a user is on the dashboard  
**When** they click "Table View" button in the header  
**Then** they navigate to `/table`  
**And** the same projects are displayed in table format

#### Scenario: Switch to dashboard view

**Given** a user is on the table view  
**When** they click "Dashboard" button in the header  
**Then** they navigate to `/dashboard`  
**And** the same projects are displayed in card format

---

### Requirement: Optimistic Updates with Queuing

Table view SHALL use aggressive optimistic updates with API call queuing.

**ID**: `table-optimistic`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Rapid task updates

**Given** a user clicks multiple checkboxes quickly in succession  
**Then** each checkbox updates immediately in the UI  
**And** API calls are queued to prevent race conditions  
**And** each update waits for the previous one to complete

#### Scenario: Update rollback on error

**Given** an optimistic update is made  
**When** the API call fails  
**Then** the UI reverts to the previous state  
**And** an error toast is displayed  
**And** the user can retry the action

## Related Capabilities

- [Project Management](../project-management/spec.md) - Projects SHALL displayed as columns
- [Task Management](../task-management/spec.md) - Tasks displayed as rows
- [Dashboard View](../dashboard-view/spec.md) - Alternative view mode
- [Theme System](../theme-system/spec.md) - Applies theme styling
