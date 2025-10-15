# User Profile

## Purpose

User profile management interface displaying user information and providing account settings access.

## Requirements

### Requirement: View Profile Information

The system SHALL allow users to view their profile information from Google OAuth.

**ID**: `profile-view`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Display user profile

**Given** a user is authenticated  
**When** they navigate to `/profile`  
**Then** their profile page displays:

- Profile image (from Google)
- Full name
- Email address
- Account creation date
- Last updated timestamp

---

### Requirement: Profile Menu Dropdown

The system SHALL provide users access profile options via a dropdown menu in the header.

**ID**: `profile-menu`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Open profile menu

**Given** a user is authenticated and viewing any page  
**When** they click their profile image in the header  
**Then** a dropdown menu appears showing:

- Link to "Profile" page
- Link to "Sign Out"

#### Scenario: Navigate to profile

**Given** the profile menu is open  
**When** the user clicks "Profile"  
**Then** they navigate to `/profile`  
**And** the menu closes

#### Scenario: Sign out from menu

**Given** the profile menu is open  
**When** the user clicks "Sign Out"  
**Then** their session is destroyed  
**And** they are redirected to the landing page

---

### Requirement: Profile Data Source

User profile information SHALL be sourced from Google OAuth and is stored in the database.

**ID**: `profile-data`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Profile updates from Google

**Given** a user signs in with Google  
**When** their Google profile information has changed  
**Then** the database user record is updated with:

- New name (if changed)
- New profile image (if changed)  
  **And** email remains the unique identifier  
  **And** the UUID remains unchanged

#### Scenario: Profile image display

**Given** a user has a Google profile image  
**Then** the image is displayed via Next.js Image component  
**And** the image is optimized for performance  
**And** a fallback is shown if the image fails to load

---

### Requirement: Profile Page Layout

The profile page SHALL use consistent application layout with theme support.

**ID**: `profile-layout`  
**Priority**: Medium  
**Status**: Implemented

#### Scenario: Consistent header and footer

**Given** a user views their profile  
**Then** the page includes the standard header with navigation  
**And** the page includes the standard footer  
**And** the theme (light/dark) is applied consistently

#### Scenario: Responsive design

**Given** a user accesses the profile on different devices  
**Then** the layout adapts to screen size  
**And** all information remains readable and accessible

---

### Requirement: Profile Security

Profile pages are protected and Users SHALL only view their own profile.

**ID**: `profile-security`  
**Priority**: Critical  
**Status**: Implemented

#### Scenario: Authentication required

**Given** an unauthenticated user attempts to access `/profile`  
**Then** they are redirected to the sign-in page

#### Scenario: User views own profile

**Given** a user is authenticated  
**When** they access `/profile`  
**Then** they see their own profile information  
**And** they cannot access other users' profiles

## Related Capabilities

- [Authentication](../authentication/spec.md) - Provides user session data
- [Theme System](../theme-system/spec.md) - Applies theme to profile page
