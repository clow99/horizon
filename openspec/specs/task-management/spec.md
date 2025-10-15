# Task Management

## Purpose

Management of individual checklist tasks within projects. Tasks have status, category, notes, and completion tracking with user audit trails.

## Requirements

### Requirement: Create Custom Task

The system SHALL allow users to add custom tasks to any project with full metadata.

**ID**: `task-create`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Add custom task to project

**Given** a user views a project  
**When** they click "Add Custom Task"  
**And** they fill in task name, description, category, status  
**And** they optionally mark it as required  
**And** they click "Add Task"  
**Then** the task is created with a UUID  
**And** the task appears in the project's task list  
**And** the task is persisted to the database

#### Scenario: Task name is required

**Given** a user is adding a custom task  
**When** they leave the task name empty  
**And** they attempt to submit  
**Then** validation prevents submission  
**And** an error message is displayed

---

### Requirement: Update Task Status

The system SHALL allow users to change task status with completion tracking and user attribution.

**ID**: `task-status`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Mark task as completed

**Given** a user views a task with status "In Progress"  
**When** they change the status to "Completed"  
**Then** the task status updates immediately (optimistic)  
**And** the `completed_at` timestamp is set to current time  
**And** the user's ID, name, and image are recorded in `updated_by_*` fields  
**And** an API call persists the change  
**And** the project progress percentage recalculates

#### Scenario: Mark task as incomplete

**Given** a user views a task with status "Completed"  
**When** they change the status to "Not Started" or "In Progress"  
**Then** the `completed_at` timestamp is cleared  
**And** the user attribution is updated  
**And** the project progress percentage recalculates

#### Scenario: Available status values

**Given** a user is updating task status  
**Then** the following values are available:

- Not Started
- In Progress
- Completed
- Blocked

---

### Requirement: Toggle Task Completion

The system SHALL allow users to quickly toggle task completion with a checkbox.

**ID**: `task-toggle`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Check task as done

**Given** a user views an incomplete task  
**When** they click the completion checkbox  
**Then** the task status changes to "Completed"  
**And** the checkbox shows checked state immediately  
**And** the completed_at timestamp is set  
**And** user tracking is recorded

#### Scenario: Uncheck completed task

**Given** a user views a completed task  
**When** they click the completion checkbox  
**Then** the task status changes to "Not Started"  
**And** the checkbox shows unchecked state  
**And** the completed_at timestamp is cleared

---

### Requirement: Task Categories

Tasks SHALL be organized into predefined categories for filtering and organization.

**ID**: `task-categories`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Available categories

**Given** a user creates or edits a task  
**Then** the following categories are available:

- Infrastructure
- Security
- Monitoring
- DevOps
- Testing
- Marketing
- Legal
- Deployment

#### Scenario: Filter tasks by category

**Given** a user views a project with tasks in multiple categories  
**When** they select a category filter  
**Then** only tasks in that category are displayed  
**When** they clear the filter  
**Then** all Tasks SHALL be displayed

---

### Requirement: Task Notes

The system SHALL allow users to add detailed notes to tasks for additional context.

**ID**: `task-notes`  
**Priority**: Medium  
**Status**: Implemented

#### Scenario: Add notes to task

**Given** a user views a task  
**When** they click "Add notes"  
**And** they enter text in the notes field  
**And** they save the notes  
**Then** the notes are persisted to the database  
**And** the notes are visible on the task

#### Scenario: Edit existing notes

**Given** a task has existing notes  
**When** a user edits the notes text  
**Then** the updated notes replace the old notes

#### Scenario: Notes field usage

**Given** the notes field supports any text  
**Then** Users SHALL add URLs, assignee names, or other context  
**And** the field supports multi-line text

---

### Requirement: Required Task Flag

Tasks SHALL be markable as required for deployment readiness tracking.

**ID**: `task-required`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Mark task as required

**Given** a user creates or edits a task  
**When** they check the "Required" checkbox  
**Then** the task is marked as required in the database  
**And** the task displays a visual indicator (badge) showing it's required

#### Scenario: Required tasks affect deployment readiness

**Given** a project has required tasks  
**When** all required Tasks SHALL be completed  
**Then** the project shows as "ready for deployment"  
**When** any required task is incomplete  
**Then** the project shows as "not ready"

---

### Requirement: Delete Task

The system SHALL allow users to delete tasks from projects.

**ID**: `task-delete`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Delete task

**Given** a user views a task  
**When** they click the delete button on the task  
**Then** the task is removed from the UI immediately  
**And** the task is deleted from the database  
**And** the project's task count and progress recalculate  
**And** the deletion cannot be undone

---

### Requirement: Task-Specific API Endpoint

Individual task updates SHALL use dedicated endpoints for efficiency.

**ID**: `task-api`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Update single task field

**Given** a user changes a task's status  
**When** the optimistic update completes  
**Then** an API call is made to `/api/projects/{projectId}/tasks/{taskId}`  
**And** only the changed fields are sent in the request body  
**And** the response includes the updated task with user tracking info

#### Scenario: Task update includes user attribution

**Given** a task update API call succeeds  
**When** the response is returned  
**Then** it includes `updated_by_user_id`  
**And** it includes `updated_by_user_name`  
**And** it includes `updated_by_user_image`  
**And** these values are from the authenticated user's session

---

### Requirement: User Tracking on Tasks

Tasks SHALL track which user last modified them for audit and collaboration.

**ID**: `task-user-tracking`  
**Priority**: Medium  
**Status**: Implemented

#### Scenario: Display last updater

**Given** a task was updated by a user  
**When** another user views the task  
**Then** they can see who last updated it  
**And** they can see the user's name and profile image  
**And** they can see when it was last updated

#### Scenario: User info is cached

**Given** a task update includes user tracking  
**Then** the user's name and image are stored in the task record  
**And** not just the user ID reference  
**And** this allows display without additional user table joins

## Related Capabilities

- [Project Management](../project-management/spec.md) - Tasks belong to projects
- [Dashboard View](../dashboard-view/spec.md) - Display and manage tasks per project
- [Table View](../table-view/spec.md) - Batch operations across projects
- [Authentication](../authentication/spec.md) - User context for tracking
