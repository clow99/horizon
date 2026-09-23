# Authentication

## Purpose

User authentication system using NextAuth.js with Google OAuth provider. Manages user sessions, database user records, and protects API routes.

## Requirements

### Requirement: OAuth Authentication

Users MUST authenticate using Google OAuth to access the application.

**ID**: `auth-oauth`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: User signs in with Google

**Given** a user visits the landing page  
**When** they click "Sign in with Google"  
**Then** they are redirected to Google OAuth consent screen  
**And** upon successful authentication, they are redirected back to the application  
**And** a session is created with their user information

#### Scenario: Verified Google identity is synchronized with database

**Given** Google returns an explicitly verified email and stable subject
**When** the authentication callback processes
**Then** an existing user is selected by its linked Google subject
**And** a new user receives a UUID and unique Google subject
**And** the user's UUID is added to their session

#### Scenario: Existing account linking

**Given** an existing user has no Google subject
**When** a verified Google identity matches its Gmail address
**Then** the subject is linked to the existing UUID without replacing its data
**And** an existing non-Gmail address requires independent owner recovery

#### Scenario: Unverified or conflicting identity

**Given** Google does not explicitly verify the email, or a different subject is linked to that email
**When** the authentication callback processes
**Then** sign-in is denied without changing account ownership

---

### Requirement: Session Management

User sessions MUST persist across page loads and include user identity.

**ID**: `auth-session`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Session includes user ID

**Given** a user is authenticated  
**When** their session is loaded  
**Then** it includes their database UUID  
**And** it includes their email address  
**And** it includes their name and profile image

---

### Requirement: API Route Protection

All API routes MUST require authentication and return 401 for unauthenticated requests.

**ID**: `auth-api-protection`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Unauthenticated API request is rejected

**Given** a user is not authenticated  
**When** they make a request to any `/api/projects/*` endpoint  
**Then** the request returns HTTP 401 Unauthorized  
**And** returns a JSON error message

#### Scenario: Authenticated API request is allowed

**Given** a user is authenticated with a valid session  
**When** they make a request to any `/api/projects/*` endpoint  
**Then** the request is processed  
**And** their user ID is available from the session

---

### Requirement: User Data Isolation

Users MUST only access their own data (multi-tenant isolation).

**ID**: `auth-data-isolation`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Projects are filtered by user ID

**Given** a user is authenticated  
**When** they request their projects  
**Then** only projects where `user_id` matches their session user ID are returned  
**And** projects belonging to other users are never visible

#### Scenario: Tasks SHALL be filtered by project ownership

**Given** a user attempts to access a task  
**When** the task belongs to a project owned by a different user  
**Then** the request is rejected or returns empty results

---

### Requirement: Sign Out

Users MUST be able to sign out and destroy their session.

**ID**: `auth-signout`  
**Priority**: High  
**Status**: Implemented

#### Scenario: User signs out

**Given** a user is authenticated  
**When** they click "Sign Out" from the profile menu  
**Then** their session is destroyed  
**And** they are redirected to the landing page  
**And** they must re-authenticate to access protected pages

## Related Capabilities

- [User Profile](../user-profile/spec.md) - Displays authenticated user information
- [Project Management](../project-management/spec.md) - Requires authentication for all operations
- [Task Management](../task-management/spec.md) - Requires authentication and project ownership
