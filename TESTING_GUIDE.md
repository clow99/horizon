# Horizon Testing Guide

This guide covers the complete testing strategy for Horizon, including unit/component tests, integration tests, and end-to-end tests.

## Quick Start

### Run All Tests

```bash
npm run test:all
```

This runs the complete test suite with coverage reporting and blocks the build if thresholds aren't met.

### Run Specific Test Suites

**Unit and Component Tests (Jest)**

```bash
npm run test:unit
```

**Integration Tests (Jest)**

```bash
npm run test:integration
```

**End-to-End Tests (Playwright)**

```bash
npm run test:e2e
npm run test:e2e:ui    # Interactive UI mode
```

**Coverage Report Only**

```bash
npm run test
```

## Test Architecture

### 1. Unit & Component Tests (`src/**/*.test.js`)

**Coverage Target:** 80% global, 90% for `src/lib/**`

Tests critical UI components and utilities using React Testing Library and Jest.

#### Key Test Files

- `src/components/__tests__/CreateProjectModal.test.js` - Multi-step project creation flow
- `src/components/__tests__/DashboardClient.test.js` - Progress calculations, archived filtering, sorting
- `src/components/__tests__/ProfileClient.test.js` - User metadata display, edit UI
- `src/lib/client/__tests__/mergeProjectUpdate.test.js` - Complex update merging logic

#### Running Specific Component Tests

```bash
npm run test:unit -- --testNamePattern="DashboardClient"
npm run test:unit -- CreateProjectModal.test.js
```

### 2. Integration Tests (`tests/integration/**`)

**Coverage:** API endpoints, database operations, auth callbacks

Tests critical flows using the SQLite harness and deterministic auth stubs.

#### Test Suites

- `tests/integration/api/projects.test.js` - GET/POST projects, filtering, pagination
- `tests/integration/api/project-update.test.js` - PUT/DELETE, task synchronization
- `tests/integration/api/task-status.test.js` - PATCH task updates, audit metadata
- `tests/integration/api/project-order.test.js` - Reordering with ownership validation
- `tests/integration/setup/auth-callbacks.test.js` - NextAuth user creation/updates

#### Running Integration Tests

```bash
npm run test:integration
npm run test:integration -- projects.test.js
npm run test:integration -- --testNamePattern="authorization"
```

### 3. End-to-End Tests (`tests/e2e/**`)

**Tools:** Playwright (Chromium headless)

Tests authenticated workflows from user perspective.

#### Key Scenarios (Placeholders for implementation)

- Login and dashboard access
- Project creation from templates
- Task status toggling with progress updates
- Project archiving and restoration
- Drag-and-drop reordering

#### Running E2E Tests

```bash
npm run test:e2e              # Run all specs
npm run test:e2e --headed     # Show browser window
npm run test:e2e --debug      # Step through tests
npm run test:e2e:ui           # Interactive test explorer
```

## Test Utilities & Helpers

### Database Harness (`tests/setup/database.js`)

Provides SQLite in-memory database for deterministic testing.

**Key Functions:**

- `getTestDatabase()` - Get/create test DB instance
- `resetTestDatabase()` - Fresh DB for each test
- `executeQuery(sql, params)` - Execute SQL with parameter binding
- `clearAllTables()` - Clear all data
- `truncateTables([...])` - Clear specific tables

**Example:**

```javascript
import {
  resetTestDatabase,
  executeQuery,
  seedUser,
  seedProject,
} from "../../setup/database";

beforeEach(() => {
  resetTestDatabase();
});

test("lists user projects", () => {
  const user = seedUser({ email: "test@example.com" });
  seedProject({ user_id: user.id, name: "Test Project" });

  const projects = executeQuery("SELECT * FROM projects WHERE user_id = ?", [
    user.id,
  ]);
  expect(projects).toHaveLength(1);
});
```

### Factories (`tests/setup/factories.js`)

Builds deterministic test data with factories.

**Key Factories:**

- `createUser(overrides)` - Factory for user objects
- `createProject(overrides)` - Factory for projects
- `createProjectWithTasks(projectOverrides, taskOverrides)` - Projects with nested tasks
- `seedUser()` / `seedProject()` / `seedTask()` - Insert and return records
- `seedUserWithProjects(options)` - Seed complete user + projects + tasks

**Example:**

```javascript
const { user, projects } = seedUserWithProjects({
  projectCount: 2,
  tasksPerProject: 3,
});

projects.forEach((p) => {
  expect(p.user_id).toBe(user.id);
});
```

### Auth Stubs (`tests/setup/auth-session.js`)

Mock NextAuth for deterministic testing without OAuth.

**Key Functions:**

- `createTestSession(overrides)` - Create session object
- `mockAuthenticatedUser(userOverrides)` - Mock logged-in user
- `mockUnauthenticatedSession()` - Mock no session
- `ensureDatabaseTestUser(overrides)` - Ensure test user exists in DB
- `buildPlaywrightAuthPayload()` - Encode session for Playwright

**Example (Jest Integration Test):**

```javascript
import {
  mockAuthenticatedUser,
  restoreAuthSession,
} from "../../setup/auth-session";

beforeEach(() => {
  mockAuthenticatedUser({ id: "user-123" });
});

afterEach(() => {
  restoreAuthSession();
});

test("fetches authenticated user projects", () => {
  // Auth is mocked - no OAuth needed
});
```

**Example (Playwright Test):**

```javascript
import { buildPlaywrightAuthPayload } from "../setup/auth-session";

const payload = buildPlaywrightAuthPayload({ id: "user-123" });
await page.goto(url, {
  headers: payload.headers,
});
```

## Coverage Thresholds

### Jest Coverage Requirements

**Global (all of `src/`):**

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

**Persistence Utilities (`src/lib/**):\*\*

- Statements: 90%
- Branches: 90%
- Functions: 90%
- Lines: 90%

### Check Coverage

```bash
npm run test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Coverage Failures

If build fails due to coverage:

1. Run `npm run test -- --coverage` to see detailed report
2. Add tests for uncovered lines in relevant `.test.js` files
3. Ensure test assertions actually exercise the code paths

## Common Workflows

### Adding a New Component Test

```bash
# 1. Create test file alongside component
touch src/components/__tests__/NewComponent.test.js

# 2. Add basic tests using React Testing Library
# 3. Run tests and verify coverage improves
npm run test:unit -- NewComponent.test.js

# 4. Check impact on global coverage
npm run test
```

### Adding Integration Tests for New API Endpoint

```bash
# 1. Create test file in tests/integration/api/
touch tests/integration/api/new-endpoint.test.js

# 2. Use seedUserWithProjects and executeQuery helpers
# 3. Test authorization, validation, and happy paths
npm run test:integration -- new-endpoint.test.js
```

### Debugging a Failing Test

```bash
# Run single test file
npm run test:unit -- SpecificComponent.test.js

# Run tests matching pattern
npm run test:unit -- --testNamePattern="specific case"

# Watch mode for rapid iteration
npm run test:watch

# Debug in VS Code
# Add breakpoint, then use Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Troubleshooting

### Issue: "SQLite database is locked"

**Cause:** Multiple tests running in parallel, all accessing same in-memory DB
**Solution:** Tests are isolated by default. If persisting, call `resetTestDatabase()` in `beforeEach()`

### Issue: "Unauthorized" in integration tests

**Cause:** Auth mock not initialized
**Solution:** Call `mockAuthenticatedUser()` in test or `beforeEach()`

```javascript
beforeEach(() => {
  mockAuthenticatedUser({ id: "test-user-id" });
});
```

### Issue: "Cannot find module @/auth"

**Cause:** Module aliases not configured for Jest
**Solution:** Verify `jsconfig.json` contains alias and Jest config includes `moduleNameMapper`

### Issue: Coverage thresholds fail

**Cause:** New code reduces overall coverage below threshold
**Solution:** Add tests for new code paths or adjust implementation to improve testability

```bash
npm run test -- --coverage
# View failing coverage in report
```

### Issue: Playwright timeouts

**Cause:** Dev server not running or auth helper route not mounted
**Solution:** Ensure Next.js server is running (`npm run dev`) before E2E tests

### Issue: Tests pass locally but fail in CI

**Cause:** Timing issues, database state leakage, or missing env vars
**Solution:**

- Verify `resetTestDatabase()` in `beforeEach()`
- Check `.env` variables are set in CI
- Add explicit waits instead of arbitrary delays
- Review CI workflow logs for full error

## Environment Variables for Testing

### Required for Integration Tests

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-key-for-testing-only
NEXTAUTH_TEST_TOKEN=nextauth-test-token
```

These are automatically set by test helpers if not provided.

### Database

SQLite in-memory database is used automatically. No setup needed.

## Continuous Integration

The `prebuild` script runs before every build:

```bash
npm run prebuild  # Runs npm run test:all
```

If any test or coverage check fails, the build is blocked.

### CI Pipeline

1. Install dependencies
2. Run `npm run test:all` (unit + integration + coverage)
3. Run `npm run test:e2e` (Playwright scenarios)
4. Run `npm run build` (fails if tests failed due to prebuild hook)

## Performance Tips

### Speed Up Tests

```bash
# Run only tests that changed
npm run test -- --onlyChanged

# Run tests in parallel (default for Jest)
npm run test:unit

# Skip E2E if not needed
npm run test && npm run test:integration
```

### Reduce Build Time in CI

- Cache `node_modules`: `npm ci --prefer-offline --no-audit`
- Cache Playwright browsers: `.github/workflows/test.yml`
- Parallelize test jobs if needed

## Next Steps

1. **Add E2E specs** for project creation, archiving, reordering
2. **Increase component coverage** for remaining UI flows
3. **Monitor coverage trends** in CI/CD
4. **Integrate into dev workflow** with pre-commit hooks (optional)

---

For questions or issues, refer to `DEVELOPMENT.md` or open an issue on GitHub.
