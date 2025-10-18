## ADDED Requirements

### Requirement: PLAY-001 - The system SHALL gate production builds on Playwright success
`npm run build` SHALL execute the full Playwright suite (via `npm run test:e2e` or equivalent) before running `next build`. The command SHALL exit non-zero when any Playwright spec fails or produces a failing assertion.

#### Scenario: Build aborts on Playwright regression
- **GIVEN** a developer runs `npm run build`
- **WHEN** a Playwright spec fails an assertion
- **THEN** the `test:e2e` stage exits with a non-zero status
- **AND** `next build` does not execute
- **AND** the terminal output highlights the failing spec and location

#### Scenario: Build passes with clean Playwright run
- **GIVEN** all Playwright specs pass for the current revision
- **WHEN** a developer runs `npm run build`
- **THEN** `test:e2e` completes successfully
- **AND** the build proceeds to `next build`
- **AND** the overall command exits with status code 0

### Requirement: PLAY-002 - The system SHALL cover authenticated project lifecycle flows in Playwright
The Playwright suite SHALL authenticate a deterministic test user and exercise project creation, task interactions, archiving/restoring, and ordering workflows across dashboard and table views.

#### Scenario: Authenticated lifecycle flow passes
- **GIVEN** Playwright seeds a valid session for the test user
- **WHEN** the suite runs the project lifecycle spec
- **THEN** the spec creates a project from a template, adds custom tasks, toggles statuses, archives and restores the project, and verifies ordering persistence via UI refresh
- **AND** each step asserts the expected UI state (progress bars, task badges, table rows)

### Requirement: PLAY-003 - The system SHALL provide deterministic fixtures for Playwright
Playwright SHALL expose fixtures/helpers to seed and reset database state, manage session cookies, and run each spec in isolation without data leakage.

#### Scenario: State resets between specs
- **GIVEN** two Playwright specs run sequentially
- **WHEN** the first spec creates and archives projects
- **THEN** the second spec observes a clean workspace seeded only with its own factories
- **AND** shared helpers reset database tables or invoke API cleanup hooks between specs

### Requirement: PLAY-004 - The system SHALL capture Playwright artifacts for debugging
Playwright SHALL store screenshots, videos, and traces for every failing spec and support optional checkpoint screenshots when `PLAYWRIGHT_CAPTURE=verbose` is set.

#### Scenario: Failure artifacts captured automatically
- **GIVEN** a Playwright assertion fails
- **WHEN** the suite finishes running
- **THEN** a screenshot, video, and trace file are written to `artifacts/playwright/<run-id>/`
- **AND** paths to those artifacts are printed in the terminal output for quick access

#### Scenario: Verbose capture stores checkpoints
- **GIVEN** the environment variable `PLAYWRIGHT_CAPTURE` is set to `verbose`
- **WHEN** a lifecycle spec reaches its preconfigured checkpoints (e.g., pre-submit, post-success)
- **THEN** the spec captures additional screenshots alongside the default failure artifacts
- **AND** the captures are grouped under the run directory with descriptive filenames

### Requirement: PLAY-005 - The system SHALL document Playwright usage and artifact handling
Documentation SHALL describe prerequisites, commands, environment toggles, artifact locations, and CI integration steps for the Playwright suite.

#### Scenario: Developer follows Playwright guide
- **GIVEN** a new contributor reads `TESTING_GUIDE.md`
- **WHEN** they follow the Playwright section to install browsers, run specs, and inspect artifacts
- **THEN** the documented commands execute successfully
- **AND** the guide explains how to enable verbose screenshots and where CI uploads artifacts
