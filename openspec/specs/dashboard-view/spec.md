# Dashboard View

## Purpose

Project-centric interface displaying projects as expandable cards with full task details. Primary view for managing individual projects and their complete checklists.

## Requirements

### Requirement: Project Card Display

Projects SHALL be displayed as cards with key metadata and expand/collapse functionality.

**ID**: `dashboard-cards`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Display project card

**Given** a user views the dashboard  
**Then** each project is displayed as a card showing:

- Project name (editable inline)
- Description (editable inline)
- Client name (editable inline)
- Target date (editable inline)
- Status dropdown
- Progress bar with percentage
- Task completion count (X of Y completed)
- Project type badge (if set)

#### Scenario: Expand project to view tasks

**Given** a project card is collapsed  
**When** a user clicks the expand arrow  
**Then** the project expands to show all tasks  
**And** the arrow rotates to indicate expanded state  
**And** the expanded state is maintained during the session

#### Scenario: Collapse project

**Given** a project card is expanded  
**When** a user clicks the collapse arrow  
**Then** the project collapses to hide tasks  
**And** only the project summary remains visible

---

### Requirement: Inline Editing

The system SHALL allow users to edit project fields directly in the dashboard without modals.

**ID**: `dashboard-inline-edit`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Edit field on blur

**Given** a user clicks on an editable field  
**When** they modify the text  
**And** they click outside the field (blur)  
**Then** the change is saved immediately with optimistic update  
**And** an API call persists the change

#### Scenario: Edit field on Enter key

**Given** a user is editing a field  
**When** they press Enter  
**Then** the change is saved  
**And** the field loses focus

#### Scenario: Visual feedback during edit

**Given** a field is being edited  
**Then** it has a distinct visual style (border, background)  
**And** clicking outside the field commits the change

---

### Requirement: Task List Display

Tasks SHALL be displayed within expanded projects with full interaction capabilities.

**ID**: `dashboard-tasks`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Display task in list

**Given** a project is expanded  
**Then** each task shows:

- Completion checkbox
- Task name
- Task description
- Category badge with color coding
- Status dropdown
- Required badge (if applicable)
- Notes button/field
- Delete button
- User tracking info (who last updated)

#### Scenario: Color-coded categories

**Given** tasks have different categories  
**Then** each category badge has a distinct color:

- Infrastructure: blue
- Security: red
- Monitoring: purple
- DevOps: green
- Testing: yellow
- Marketing: pink
- Legal: orange
- Deployment: indigo

---

### Requirement: Create Project Modal

The system SHALL allow users to create new projects through a modal interface with template selection.

**ID**: `dashboard-create-modal`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Open create modal

**Given** a user views the dashboard  
**When** they click "New Project" button  
**Then** a modal appears with project creation options

#### Scenario: Select project template

**Given** the create project modal is open  
**When** a user selects "With Default Tasks"  
**Then** a dropdown of project types appears  
**And** project type icons and descriptions are shown  
**When** they select a project type and click Create  
**Then** the project is created with that template's tasks

#### Scenario: Create empty project

**Given** the create project modal is open  
**When** a user selects "Empty Project"  
**And** clicks "Create Project"  
**Then** a project is created with no tasks  
**And** the modal closes

---

### Requirement: Sort and Filter

The system SHALL allow users to sort projects by multiple criteria.

**ID**: `dashboard-sort`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Available sort options

**Given** a user views the dashboard  
**Then** the following sort options are available:

- Custom (drag-and-drop order)
- Deadline (target date)
- Alphabetical (project name)
- Completion (progress percentage)

#### Scenario: Apply sort

**Given** a user selects a sort option  
**Then** projects reorder immediately according to the criteria  
**And** the sort persists during the session

---

### Requirement: Progress Indicators

Visual progress indicators SHALL show completion status at a glance.

**ID**: `dashboard-progress`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Progress bar

**Given** a project has tasks  
**When** some Tasks SHALL be completed  
**Then** a progress bar shows the completion percentage  
**And** the bar is color-coded (green for high completion, yellow for medium, red for low)

#### Scenario: Task count badge

**Given** a project card  
**Then** it shows "X of Y tasks completed"  
**And** updates immediately when task status changes

---

### Requirement: Project Actions

The system SHALL allow users to perform actions on projects from the dashboard.

**ID**: `dashboard-actions`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Delete project

**Given** a user hovers over a project card  
**When** they click the delete icon  
**Then** a confirmation modal appears  
**When** they confirm  
**Then** the project is deleted with optimistic UI update

#### Scenario: Archive project

**Given** a user views a project card  
**When** they click the archive button  
**Then** the project is archived  
**And** disappears from the active view

---

### Requirement: Add Custom Task Interface

The system SHALL allow users to add custom tasks to projects from the dashboard.

**ID**: `dashboard-add-task`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Open add task form

**Given** a project is expanded  
**When** a user clicks "Add Custom Task"  
**Then** a form appears with fields for:

- Task name (required)
- Description
- Category dropdown
- Status dropdown
- Required checkbox

#### Scenario: Submit custom task

**Given** the add task form is filled  
**When** the user clicks "Add Task"  
**Then** the task is created with optimistic update  
**And** appears in the task list immediately  
**And** an API call persists the task

---

### Requirement: Toast Notifications

The system SHALL provide users with feedback for actions via toast notifications.

**ID**: `dashboard-toasts`  
**Priority**: Medium  
**Status**: Implemented

#### Scenario: Show success toast

**Given** a user completes an action successfully  
**Then** a green toast appears with a success message  
**And** auto-dismisses after 3 seconds

#### Scenario: Show error toast

**Given** an API call fails  
**Then** a red toast appears with an error message  
**And** the user can manually dismiss it

---

### Requirement: Drag and Drop Reordering

The system SHALL allow users to reorder projects via drag and drop.

**ID**: `dashboard-dnd`  
**Priority**: Medium  
**Status**: Implemented

#### Scenario: Drag project card

**Given** a user clicks and holds a project card  
**When** they drag it to a new position  
**Then** a visual indicator shows the drop target  
**And** other projects shift to make space

#### Scenario: Drop project card

**Given** a project is being dragged  
**When** the user releases it in a new position  
**Then** the projects reorder immediately  
**And** an API call saves the display order  
**And** a loading indicator shows during save

## Related Capabilities

- [Project Management](../project-management/spec.md) - Core CRUD operations
- [Task Management](../task-management/spec.md) - Task operations within projects
- [Table View](../table-view/spec.md) - Alternative view mode
- [Theme System](../theme-system/spec.md) - Applies theme styling
