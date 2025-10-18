# Testing Infrastructure Specification

**Capability**: `testing-infrastructure`  
**Status**: New (ADDED)  
**Version**: 1.0.0  
**Last Updated**: 2025-10-14

## Overview

This specification defines the production-grade automated testing infrastructure for the Horizon application. It covers unit testing, integration testing, and end-to-end testing capabilities that ensure code quality, prevent regressions, and provide confidence in deployments.

---

## ADDED Requirements

### Requirement: TEST-001 - The system SHALL provide Jest Test Framework Configuration

The system SHALL provide a fully configured Jest testing framework for unit and integration tests.

**Acceptance Criteria**:

- Jest configuration file (`jest.config.js`) exists with appropriate settings
- JSdom test environment configured for React component testing
- Babel/SWC transpilation configured for Next.js compatibility
- Module path aliases match Next.js configuration (`@/` → `src/`)
- Coverage collection configured for `src/**/*.js` files
- Coverage thresholds enforce 80% minimum (statements, branches, functions, lines)
- Global test setup file (`jest.setup.js`) configures test environment
- Custom matchers and test utilities are available globally

#### Scenario: Developer runs unit tests

**Given** Jest is installed and configured  
**When** developer runs `npm test`  
**Then** Jest executes all `*.test.js` files  
**And** displays test results with pass/fail status  
**And** generates coverage report showing percentage coverage  
**And** test execution completes in under 5 seconds for unit tests

#### Scenario: Coverage threshold not met

**Given** Jest is configured with 80% coverage threshold  
**When** developer runs tests with coverage below 80%  
**Then** Jest exits with error code 1  
**And** displays coverage report highlighting uncovered lines  
**And** build script fails preventing deployment

---

### Requirement: TEST-002 - The system SHALL provide React Component Testing Setup

The system SHALL provide React Testing Library for testing React components in a user-centric manner.

**Acceptance Criteria**:

- `@testing-library/react` installed and configured
- `@testing-library/jest-dom` provides custom DOM matchers
- `@testing-library/user-event` available for interaction simulation
- Components can be rendered in test environment
- User interactions (click, type, select) can be simulated
- Accessibility queries (getByRole, getByLabelText) are standard
- Async operations properly handled with waitFor utilities

#### Scenario: Testing an interactive component

**Given** a component with a button that toggles state  
**When** test renders the component using `render()`  
**Then** test can query button using `screen.getByRole('button')`  
**And** test can simulate click using `fireEvent.click()` or `userEvent.click()`  
**And** test can assert UI changes after interaction  
**And** test completes without console warnings or errors

#### Scenario: Testing async component behavior

**Given** a component that loads data asynchronously  
**When** test renders the component  
**Then** test shows loading state initially  
**And** test can await data load using `waitFor()`  
**And** test verifies loaded content appears in DOM  
**And** test properly cleans up after completion

---

### Requirement: TEST-003 - The system SHALL provide End-to-End Testing Framework

The system SHALL provide Playwright for automated browser testing of complete user workflows.

**Acceptance Criteria**:

- Playwright installed with Chromium, Firefox, and WebKit browsers
- Playwright configuration file (`playwright.config.js`) exists
- Test files in `tests/e2e/` directory use `*.spec.js` naming
- Tests can launch browser, navigate to application, and interact with UI
- Auto-wait functionality prevents flaky tests
- Screenshots and videos captured on test failure
- Tests run in headless mode for CI/CD
- Parallel execution configured for faster test runs

#### Scenario: Testing complete user workflow

**Given** application is running on localhost:3000  
**When** E2E test navigates to homepage  
**Then** test can click through authentication flow  
**And** test can create a new project  
**And** test can complete tasks within project  
**And** test verifies each step with assertions  
**And** test completes in under 60 seconds for all E2E tests

#### Scenario: E2E test failure debugging

**Given** an E2E test fails during execution  
**When** Playwright detects the failure  
**Then** Playwright captures screenshot of failure state  
**And** Playwright saves browser trace for debugging  
**And** test output shows exact line and assertion that failed  
**And** developer can replay test with `--ui` flag to debug interactively

---

### Requirement: TEST-004 - The system SHALL use In-Memory SQLite Test Database

The system SHALL use in-memory SQLite for fast, isolated database testing without external dependencies.

**Acceptance Criteria**:

- `better-sqlite3` package installed
- Database adapter detects `NODE_ENV=test` and uses SQLite
- MySQL schema automatically converted to SQLite-compatible DDL
- Each test receives fresh database instance
- Foreign keys and constraints enforced in test database
- Database operations (INSERT, SELECT, UPDATE, DELETE) work identically
- Test database disposed after each test
- No test data pollution between tests

#### Scenario: Running integration tests with database

**Given** `NODE_ENV=test` is set  
**When** integration test requires database connection  
**Then** test uses in-memory SQLite instead of MySQL  
**And** test creates tables from converted schema  
**And** test can insert, query, and delete data  
**And** test completes in under 100ms per database operation  
**And** database is reset before next test

#### Scenario: Schema compatibility verification

**Given** MySQL schema uses specific data types and constraints  
**When** schema is converted for SQLite  
**Then** VARCHAR maps to TEXT  
**And** DATETIME/TIMESTAMP map to TEXT with ISO format  
**And** TINYINT(1) maps to INTEGER for booleans  
**And** AUTO_INCREMENT maps to AUTOINCREMENT  
**And** foreign key relationships are preserved  
**And** unique constraints are maintained

---

### Requirement: TEST-005 - The system SHALL provide Test Data Factories and Builders

The system SHALL provide factories for generating consistent, realistic test data.

**Acceptance Criteria**:

- Factory functions exist for all domain entities (User, Project, Task)
- Factories generate valid UUIDs for ID fields
- Factories accept overrides for customization
- Factories use realistic default values
- Related entities can be created together (Project with Tasks)
- Factories handle relationships correctly (foreign keys)
- Test data is deterministic when needed for reproducibility

#### Scenario: Creating test project with tasks

**Given** a test needs a project with specific tasks  
**When** test calls `createProject()` factory  
**Then** factory generates valid project with UUID  
**And** factory can accept `{ name: 'Custom Name' }` override  
**And** factory can create nested tasks via `tasks` parameter  
**And** generated data passes all schema validations  
**And** relationships are correctly established

#### Scenario: Generating user with authentication session

**Given** a test needs authenticated user context  
**When** test calls `createTestSession()` helper  
**Then** helper returns NextAuth-compatible session object  
**And** session includes user ID, email, name, and expiry  
**And** session can be used with `mockAuthSession()` to mock auth  
**And** API routes see authenticated user in tests

---

### Requirement: TEST-006 - The system SHALL provide Authentication Mocking Utilities

The system SHALL provide utilities to mock NextAuth authentication in tests.

**Acceptance Criteria**:

- `mockAuthSession()` helper mocks NextAuth `auth()` function
- Helper accepts user object or null for unauthenticated state
- Mock persists for duration of test
- Mock is automatically reset between tests
- API routes in tests behave as if user is authenticated
- Test can verify authorization logic (401 responses)
- Different users can be simulated in same test file

#### Scenario: Testing authenticated API endpoint

**Given** an API route requires authentication  
**When** test mocks session with `mockAuthSession(user)`  
**Then** API route sees authenticated user via `await auth()`  
**And** API route returns user-specific data  
**And** test can verify data is correctly filtered by user_id  
**And** mock is cleared after test completes

#### Scenario: Testing unauthorized access

**Given** an API route requires authentication  
**When** test mocks session with `mockAuthSession(null)`  
**Then** API route sees no authenticated user  
**And** API route returns 401 Unauthorized response  
**And** test can verify error message is appropriate  
**And** test can verify no data was leaked

---

### Requirement: TEST-007 - The system SHALL generate Coverage Reporting and Enforcement

The system SHALL generate coverage reports and enforce minimum thresholds to maintain code quality.

**Acceptance Criteria**:

- Jest generates coverage report on every test run
- Coverage report includes statements, branches, functions, and lines
- Global threshold is 80% for all metrics
- Critical modules (lib/) require 90% coverage
- Coverage report shows uncovered lines with line numbers
- Coverage report output in terminal and HTML format
- Build fails if coverage below threshold
- Coverage reports can be viewed in CI/CD artifacts

#### Scenario: Meeting coverage requirements

**Given** codebase has comprehensive tests  
**When** developer runs `npm test`  
**Then** Jest reports coverage above 80% for all metrics  
**And** build succeeds and proceeds to next step  
**And** coverage report shows green checkmarks  
**And** HTML coverage report can be opened for detailed view

#### Scenario: Failing coverage requirements

**Given** new code added without sufficient tests  
**When** developer runs `npm test`  
**Then** Jest reports coverage below 80% threshold  
**And** Jest exits with error code 1  
**And** terminal highlights files with insufficient coverage  
**And** build process stops before deployment  
**And** developer must add tests to proceed

---

### Requirement: TEST-008 - The system SHALL integrate CI/CD Integration and Build Scripts

The system SHALL integrate tests into the build and deployment pipeline to prevent broken code from reaching production.

**Acceptance Criteria**:

- `npm test` runs all unit and integration tests with coverage
- `npm run test:e2e` runs Playwright end-to-end tests
- `npm run test:all` runs complete test suite
- `npm run build` executes tests before building via `prebuild` script
- Failed tests prevent build from completing (exit code 1)
- Test results logged with clear pass/fail indicators
- Test execution time displayed in output
- Tests can be skipped for local development with `build:fast` script

#### Scenario: Successful build with passing tests

**Given** all tests pass  
**When** developer runs `npm run build`  
**Then** prebuild script runs `npm run test:all`  
**And** unit tests execute and pass  
**And** integration tests execute and pass  
**And** E2E tests execute and pass  
**And** coverage meets 80% threshold  
**And** Next.js build proceeds  
**And** build completes successfully with exit code 0

#### Scenario: Build blocked by failing test

**Given** one test fails  
**When** developer runs `npm run build`  
**Then** prebuild script runs tests  
**And** Jest detects failing test  
**And** test execution stops with error  
**And** terminal shows failing test details  
**And** Next.js build never starts  
**And** process exits with code 1  
**And** deployment is prevented

---

### Requirement: TEST-009 - The system SHALL provide Test Utilities and Custom Matchers

The system SHALL provide custom Jest matchers and utilities specific to the Horizon domain.

**Acceptance Criteria**:

- Custom matcher `toBeValidUUID()` validates UUID v4 format
- Custom matcher `toHaveTaskStatus(status)` checks task status
- Custom matcher `toBeArchivedProject()` checks project archive state
- Test utilities provide common assertion helpers
- Matchers give clear error messages on failure
- Matchers work with Jest's `expect()` API
- Utilities are automatically available in all tests

#### Scenario: Using custom UUID matcher

**Given** a test creates an entity with UUID  
**When** test asserts `expect(entity.id).toBeValidUUID()`  
**Then** matcher validates UUID v4 format (8-4-4-4-12 hex pattern)  
**And** test passes if ID is valid UUID  
**And** test fails with clear message if ID is invalid  
**And** error message shows received value

#### Scenario: Using task status matcher

**Given** a test updates task status  
**When** test asserts `expect(task).toHaveTaskStatus('Completed')`  
**Then** matcher checks task.status field  
**And** test passes if status matches  
**And** test fails showing expected vs actual status  
**And** matcher works with Jest's `.not` modifier

---

### Requirement: TEST-010 - The system SHALL maintain Test Organization and File Structure

The system SHALL maintain a clear, consistent test file organization that developers can easily navigate.

**Acceptance Criteria**:

- Unit/component tests colocated in `__tests__/` subdirectories
- Integration tests in `tests/integration/` directory
- E2E tests in `tests/e2e/` directory
- Test utilities in `tests/setup/` directory
- Naming convention: `*.test.js` for Jest, `*.spec.js` for Playwright
- Each test file mirrors source file structure
- Test files import from actual source (no duplication)
- README in tests/ directory explains structure

#### Scenario: Finding tests for a component

**Given** developer wants to test or modify `ThemeToggle.js`  
**When** developer looks in component directory  
**Then** developer finds `__tests__/ThemeToggle.test.js`  
**And** test file imports from `../ThemeToggle`  
**And** test follows consistent naming pattern  
**And** test structure (describe/test blocks) is clear

#### Scenario: Adding new integration test

**Given** developer adds new API endpoint `/api/user/settings`  
**When** developer creates integration test  
**Then** test file goes in `tests/integration/api/user-settings.test.js`  
**And** test file follows existing patterns from other API tests  
**And** test imports helpers from `tests/setup/`  
**And** Jest automatically discovers and runs the test

---

### Requirement: TEST-011 - The system SHALL execute tests with Test Execution Performance standards

The system SHALL execute tests quickly to maintain developer productivity and fast CI/CD pipelines.

**Acceptance Criteria**:

- Unit tests complete in under 5 seconds total
- Integration tests complete in under 15 seconds total
- E2E tests complete in under 60 seconds total
- Full test suite completes in under 90 seconds
- Tests run in parallel where safe
- SQLite uses in-memory for speed
- Test setup/teardown is minimal
- Slow tests are identified and can be optimized

#### Scenario: Running tests during development

**Given** developer makes code change  
**When** developer runs `npm test` in watch mode  
**Then** Jest detects changed files  
**And** Jest runs only affected tests  
**And** test results appear in under 2 seconds for small changes  
**And** developer gets immediate feedback  
**And** watch mode continues monitoring for changes

#### Scenario: Running full test suite in CI/CD

**Given** code pushed to repository  
**When** CI/CD pipeline runs tests  
**Then** all unit tests execute in parallel  
**And** integration tests run with fresh SQLite database  
**And** E2E tests run in parallel across multiple workers  
**And** total execution time is under 90 seconds  
**And** results are reported to CI/CD dashboard

---

### Requirement: TEST-012 - The system SHALL provide Test Documentation and Examples

The system SHALL provide clear documentation and examples demonstrating how to write effective tests.

**Acceptance Criteria**:

- `TESTING_GUIDE.md` document exists in project root
- Guide explains how to run tests (unit, integration, E2E)
- Guide demonstrates test patterns for each layer
- Guide explains when to write each type of test
- Sample tests exist for common scenarios
- Guide documents available test utilities and matchers
- Guide explains coverage requirements and how to check
- Guide includes troubleshooting section for common issues

#### Scenario: New developer writing first test

**Given** new developer joins project  
**When** developer reads `TESTING_GUIDE.md`  
**Then** guide explains Jest and test structure  
**And** guide shows example component test with comments  
**And** guide shows example integration test for API  
**And** guide explains how to run tests locally  
**And** developer can copy-paste examples as starting point

#### Scenario: Developer troubleshooting test failure

**Given** developer encounters flaky or failing test  
**When** developer consults troubleshooting section  
**Then** guide lists common issues (async timing, mock cleanup, etc.)  
**And** guide provides solutions for each issue  
**And** guide explains how to debug with Jest's debugging tools  
**And** guide references Playwright trace viewer for E2E debugging

---

## Non-Functional Requirements

### Performance

- Unit test suite executes in <5 seconds
- Integration test suite executes in <15 seconds
- E2E test suite executes in <60 seconds
- Full build with tests completes in <120 seconds

### Reliability

- Tests are deterministic (no random failures)
- Tests are isolated (no shared state)
- Tests clean up resources properly
- Flaky tests identified and fixed

### Maintainability

- Test code follows same quality standards as production code
- Tests are readable and well-documented
- Tests use shared utilities to stay DRY
- Obsolete tests are removed when features change

### Security

- Test database isolated from production
- Test environment variables separate from production
- Mock credentials used in tests (no real credentials)
- Test data doesn't contain sensitive information

---

## Dependencies

### External Packages

- `jest` (v29+) - Core testing framework
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interactions
- `jest-environment-jsdom` - Browser environment
- `@playwright/test` - E2E testing
- `playwright` - Browser automation
- `better-sqlite3` - In-memory test database
- `babel-jest` - Jest transpilation
- `@babel/preset-env` - JavaScript transpilation
- `@babel/preset-react` - JSX transpilation

### Internal Dependencies

- `src/lib/db.js` - Enhanced with SQLite adapter
- `src/auth.js` - Mockable for tests
- All API routes - Testable with mocked auth

---

## Future Enhancements

Potential additions beyond initial implementation:

1. **Visual Regression Testing**: Screenshot comparison for UI changes
2. **Performance Testing**: Lighthouse CI for performance metrics
3. **Mutation Testing**: Stryker.js to test test quality
4. **Contract Testing**: API contract validation with Pact
5. **Load Testing**: Artillery or k6 for load testing
6. **Security Testing**: Automated security scanning in tests
7. **Accessibility Testing**: Automated a11y checks with axe-core

---

## Glossary

- **Unit Test**: Tests single function or component in isolation
- **Integration Test**: Tests multiple components working together
- **E2E Test**: Tests complete user workflow through UI
- **Coverage**: Percentage of code executed during tests
- **Mock**: Fake implementation replacing real dependency
- **Fixture**: Predefined test data for consistent testing
- **Factory**: Function generating test data objects
- **Matcher**: Jest assertion function (expect().toBe())
- **Test Double**: Generic term for mocks, stubs, spies, fakes
