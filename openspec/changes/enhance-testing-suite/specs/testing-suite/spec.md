## ADDED Requirements

### Requirement: TESTSUITE-001 - The system SHALL enforce production-grade Jest coverage and build gating

Horizon SHALL collect coverage for all source modules under `src/**/*.{js,jsx}` and enforce a minimum of 80% statements/branches/functions/lines globally, with 90% thresholds for persistence utilities under `src/lib/**`. The build pipeline SHALL execute `npm run test:all` prior to `next build` and fail when any suite or coverage check fails.

#### Scenario: Coverage passes with enforced thresholds

- **GIVEN** a developer runs `npm run test`
- **WHEN** the aggregated coverage for `src/` meets or exceeds 80% (and 90% for `src/lib/**`)
- **THEN** Jest exits with status code 0
- **AND** the coverage report highlights all tracked files as meeting thresholds

#### Scenario: Build blocked by insufficient coverage

- **GIVEN** a module under `src/lib/` lacks sufficient tests
- **WHEN** `npm run build` executes the `prebuild` test hook
- **THEN** Jest fails the coverage threshold check
- **AND** the build aborts with a non-zero exit code before `next build` starts

### Requirement: TESTSUITE-002 - The system SHALL provide high-confidence unit and component tests for critical UI flows

The test suite SHALL exercise multi-step project creation, dashboard progress summaries, and profile presentation logic using React Testing Library, covering success paths and key edge cases (state reset, optimistic updates, accessibility labels).

#### Scenario: Project creation modal regression detection

- **GIVEN** `CreateProjectModal` is rendered in a Jest environment
- **WHEN** a test navigates through type selection, adds a custom task, and confirms creation
- **THEN** assertions verify that state resets after closing the modal and accessibility labels remain intact

#### Scenario: Dashboard progress calculations remain accurate

- **GIVEN** dashboard client logic receives projects with varying completion states
- **WHEN** a unit test triggers progress calculations and optimistic updates
- **THEN** the computed completion percentages match expected values and archived projects are excluded

### Requirement: TESTSUITE-003 - The system SHALL validate project and task API behavior via integration tests

Integration tests SHALL cover project listing, creation, update (including task diffs), deletion, task status updates, project reordering, and NextAuth callbacks using the SQLite harness and deterministic auth stubs.

#### Scenario: Project CRUD integration tests pass

- **GIVEN** the integration suite runs with SQLite reset between tests
- **WHEN** tests call GET, POST, PUT, and DELETE endpoints for `/api/projects`
- **THEN** responses reflect user-scoped data, persisted tasks, and proper error codes for unauthorized access

#### Scenario: Task status updates enforce validation

- **GIVEN** a PATCH request is issued to `/api/projects/:id/tasks/:taskId`
- **WHEN** tests simulate valid and invalid payloads
- **THEN** valid updates persist status/notes changes with audit metadata, while invalid payloads return 400 errors without modifying data

#### Scenario: NextAuth callbacks maintain user records

- **GIVEN** the integration tests mock Google profile data
- **WHEN** the `signIn` callback runs for new and existing users
- **THEN** new users are inserted with UUIDs and existing users have names/images refreshed without duplicates

### Requirement: TESTSUITE-004 - The system SHALL automate authenticated end-to-end project workflows

Playwright SHALL execute authenticated flows for logging in, creating projects from templates, toggling task statuses, archiving/restoring projects, and reordering projects, using deterministic test credentials and capturing traces on failure.

#### Scenario: Authenticated project lifecycle passes in Playwright

- **GIVEN** Playwright seeds a test session via the dedicated login helper
- **WHEN** the spec creates a project, edits tasks, archives it, restores it, and verifies order changes
- **THEN** UI assertions confirm each step, and failures capture screenshots and traces for investigation

### Requirement: TESTSUITE-005 - The system SHALL maintain deterministic test utilities and documentation

Test utilities SHALL provide database truncation, factory builders, and auth stubs that isolate test data across Jest and Playwright runs. Project documentation SHALL explain how to run each suite locally and in CI, including troubleshooting guidance.

#### Scenario: Test utilities reset state between suites

- **GIVEN** multiple integration tests run in sequence
- **WHEN** each test invokes the database reset helper from `tests/setup`
- **THEN** no data leaks between tests and factories can seed consistent records

#### Scenario: Developers follow updated testing guide

- **GIVEN** a new contributor reads `TESTING_GUIDE.md`
- **WHEN** they execute the documented commands for unit, integration, and E2E suites
- **THEN** each command succeeds with prerequisites explained, and troubleshooting steps cover common failures (auth stub, SQLite prerequisites)
