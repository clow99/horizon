# Project Management

## Purpose

Core capability for creating, reading, updating, and deleting projects. Projects represent deployment initiatives with associated metadata and tasks.

## Requirements

### Requirement: Create Project

The system SHALL allow users to create new projects with either default tasks or as empty projects.

**ID**: `project-create`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Create project with default tasks

**Given** a user clicks "New Project"  
**When** they select "With Default Tasks" and choose a project type  
**Then** a new project is created with a generated name  
**And** the project includes all default tasks for the selected project type  
**And** the project appears at the top of the project list  
**And** an optimistic UI update shows the project immediately

#### Scenario: Create empty project

**Given** a user clicks "New Project"  
**When** they select "Empty Project"  
**Then** a new project is created with no tasks  
**And** the project appears at the top of the project list

#### Scenario: Create project with custom name

**Given** a user is in the create project modal  
**When** they enter a custom project name  
**And** they click "Create Project"  
**Then** the project is created with the specified name  
**And** not a generated name

---

### Requirement: View Projects

The system SHALL allow users to view all their projects with associated tasks and metadata.

**ID**: `project-view`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Load user's projects

**Given** a user is authenticated  
**When** they access the dashboard  
**Then** all their projects are loaded from the database  
**And** each project includes its associated tasks  
**And** projects are ordered by creation date (newest first)

#### Scenario: Filter archived projects

**Given** a user has both active and archived projects  
**When** they view the project list without archive filter  
**Then** only active (non-archived) projects are shown  
**When** they toggle to show archived projects  
**Then** archived projects are loaded and displayed separately

---

### Requirement: Update Project Metadata

The system SHALL allow users to edit project fields inline with optimistic updates.

**ID**: `project-update`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Edit project name

**Given** a user views a project  
**When** they click on the project name and edit it  
**And** they blur the input or press Enter  
**Then** the UI updates immediately (optimistic)  
**And** an API call updates the database  
**And** if the API call fails, the previous value is restored

#### Scenario: Edit project description

**Given** a user views a project  
**When** they click on the description field and edit it  
**Then** the change is saved with optimistic update

#### Scenario: Edit target date

**Given** a user views a project  
**When** they click on the target date and select a new date  
**Then** the date is formatted as YYYY-MM-DD  
**And** the change is saved to the database

#### Scenario: Edit project status

**Given** a user views a project  
**When** they select a new status from the dropdown  
**Then** the status updates immediately  
**And** valid values are: Planning, In Progress, Completed, On Hold

---

### Requirement: Archive Project

The system SHALL allow users to archive projects to remove them from the active list without deleting data.

**ID**: `project-archive`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Archive an active project

**Given** a user has an active project  
**When** they click the archive button on the project  
**Then** the project's `archived` flag is set to true  
**And** the `archived_at` timestamp is set to the current time  
**And** the project disappears from the active projects view  
**And** the project can still be found in the archived view

#### Scenario: Restore an archived project

**Given** a user has an archived project  
**When** they view archived projects  
**And** they click the restore button  
**Then** the project's `archived` flag is set to false  
**And** the `archived_at` timestamp is cleared  
**And** the project reappears in the active projects view

---

### Requirement: Delete Project

The system SHALL allow users to permanently delete projects with confirmation.

**ID**: `project-delete`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Delete project with confirmation

**Given** a user views a project  
**When** they click the delete button  
**Then** a confirmation modal appears showing the project name  
**When** they confirm deletion  
**Then** the project is deleted from the database  
**And** all associated Tasks SHALL be cascade deleted (foreign key constraint)  
**And** the project disappears from the UI  
**And** a success toast notification is shown

#### Scenario: Cancel project deletion

**Given** a user clicks the delete button  
**When** the confirmation modal appears  
**And** they click "Cancel"  
**Then** the modal closes  
**And** the project is not deleted

---

### Requirement: Custom Sort Order

The system SHALL allow users to reorder projects via drag-and-drop and persist the order.

**ID**: `project-sort`  
**Priority**: Medium  
**Status**: Implemented

#### Scenario: Drag and drop project reorder

**Given** a user views the dashboard with multiple projects  
**When** they drag a project card and drop it in a new position  
**Then** the projects reorder immediately in the UI  
**And** an API call saves the new display order  
**And** the order persists on page reload

#### Scenario: Sort by different criteria

**Given** a user views the dashboard  
**When** they select a sort option (deadline, alphabetical, completion %)  
**Then** projects are reordered according to the selected criteria  
**And** the sort preference is maintained during the session

---

### Requirement: Project Type Templates

The system SHALL provide multiple project type templates with preset tasks.

**ID**: `project-types`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Available project types

**Given** a user creates a new project with default tasks  
**Then** the following project types are available:

- Production Deployment
- Website Launch
- Mobile App Release
- API Service Launch
- Database Migration
- Infrastructure Setup
- Security Compliance
- Performance Optimization

#### Scenario: Project type determines default tasks

**Given** a user selects "Website Launch" as the project type  
**When** the project is created  
**Then** the project includes tasks specific to website launches  
**And** Tasks SHALL be different from "Production Deployment" tasks

---

### Requirement: Project Progress Tracking

Projects SHALL display visual progress indicators based on task completion.

**ID**: `project-progress`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Calculate project completion percentage

**Given** a project has 10 tasks total  
**And** 3 Tasks SHALL be marked as completed  
**When** the project progress is calculated  
**Then** the progress bar shows 30% completion

#### Scenario: Track required vs total tasks

**Given** a project has required and optional tasks  
**When** the project card is displayed  
**Then** it shows completed/total counts  
**And** distinguishes between required and optional tasks

## Related Capabilities

- [Task Management](../task-management/spec.md) - Tasks belong to projects
- [Dashboard View](../dashboard-view/spec.md) - Primary interface for project management
- [Table View](../table-view/spec.md) - Alternative view for batch operations
- [Authentication](../authentication/spec.md) - All operations require authentication
