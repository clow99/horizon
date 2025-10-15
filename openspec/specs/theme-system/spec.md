# Theme System

## Purpose

Dark mode and light mode theming system with persistence and system preference detection.

## Requirements

### Requirement: Theme Toggle

The system SHALL allow users to toggle between light and dark modes.

**ID**: `theme-toggle`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Toggle theme from header

**Given** a user is viewing any page  
**When** they click the theme toggle button in the header  
**Then** the theme switches between light and dark  
**And** the change applies immediately without page reload  
**And** the toggle icon changes (sun/moon) to reflect the current theme

---

### Requirement: Theme Persistence

The system SHALL save theme preference and persist it across sessions.

**ID**: `theme-persistence`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Save theme preference

**Given** a user toggles the theme  
**When** the theme changes  
**Then** the preference is saved to localStorage  
**And** the preference persists when the user closes the browser

#### Scenario: Load saved theme

**Given** a user has previously set a theme preference  
**When** they return to the application  
**Then** their saved theme is applied on page load  
**And** there is no flash of wrong theme

---

### Requirement: System Preference Detection

The system SHALL detect and respect system dark mode preference on first visit.

**ID**: `theme-system-detect`  
**Priority**: Medium  
**Status**: Implemented

#### Scenario: Detect system preference

**Given** a user visits the application for the first time  
**And** they have not set a theme preference  
**When** the application loads  
**Then** it detects the system dark mode preference via `prefers-color-scheme`  
**And** applies dark mode if system prefers dark  
**And** applies light mode if system prefers light

#### Scenario: User preference overrides system

**Given** a user has manually set a theme preference  
**Then** their manual preference takes priority  
**And** system preference is ignored until they clear their preference

---

### Requirement: Theme Provider Context

The application SHALL manage theme state via React Context for global access.

**ID**: `theme-provider`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Theme context availability

**Given** any component in the application  
**When** it uses the `useTheme` hook  
**Then** it has access to:

- Current theme value ('light' or 'dark')
- `toggleTheme` function to switch themes  
  **And** components re-render when theme changes

#### Scenario: Root theme application

**Given** the theme changes  
**Then** a `dark` class is added to or removed from the `<html>` element  
**And** Tailwind CSS dark mode classes take effect globally

---

### Requirement: Dark Mode Styling

All UI components SHALL support dark mode styling.

**ID**: `theme-dark-styles`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Dark mode color scheme

**Given** dark mode is active  
**Then** the following colors are applied:

- Background: dark gray/black tones
- Text: light gray/white
- Cards: slightly lighter than background
- Borders: subtle gray
- Buttons: inverted colors with proper contrast  
  **And** all colors maintain WCAG AA accessibility standards

#### Scenario: Component-specific dark styles

**Given** any component (buttons, modals, cards, inputs)  
**Then** it has corresponding `dark:` Tailwind classes  
**And** the component is readable and usable in both themes

---

### Requirement: Theme Toggle Animation

Theme transitions SHALL be smooth and visually pleasing.

**ID**: `theme-animation`  
**Priority**: Low  
**Status**: Implemented

#### Scenario: Smooth color transitions

**Given** a user toggles the theme  
**Then** colors transition smoothly via CSS transitions  
**And** the transition duration is 200-300ms  
**And** layout shift is minimized during the transition

---

### Requirement: Theme in All Pages

The theme system SHALL function across all pages and views.

**ID**: `theme-global`  
**Priority**: High  
**Status**: Implemented

#### Scenario: Theme across navigation

**Given** a user has dark mode enabled  
**When** they navigate between pages (dashboard, table, profile)  
**Then** dark mode persists  
**And** all pages respect the theme setting

#### Scenario: Theme in modals and toasts

**Given** a user opens a modal or sees a toast notification  
**Then** the modal/toast uses the current theme colors  
**And** maintains proper contrast and readability

## Related Capabilities

- [Dashboard View](../dashboard-view/spec.md) - Applies theme styling
- [Table View](../table-view/spec.md) - Applies theme styling
- [User Profile](../user-profile/spec.md) - Applies theme styling
