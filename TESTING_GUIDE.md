# Horizon Testing Guide

This guide documents the testing strategy and procedures for the Horizon project. The testing suite consists of unit tests (Jest), integration tests (Jest with SQLite), and end-to-end tests (Playwright).

## Quick Start

### Run All Tests

```bash
npm run test:all
```

This runs the complete test suite in order:

1. Unit & component tests with coverage enforcement
2. Playwright E2E tests

### Run Specific Test Suites

**Unit & Component Tests (with coverage)**

```bash
npm run test:unit
```

**Watch Mode for Development**

```bash
npm run test:watch
```

**Integration Tests**

```bash
npm run test:integration
```

**End-to-End Tests**

```bash
npm run test:e2e
```

**E2E Tests with UI (debugging)**

```bash
npm run test:e2e:ui
```

## Test Coverage Requirements

The project enforces strict coverage thresholds:

- **Global Coverage**: 80% (statements, branches, functions, lines)
- **Library Code (`src/lib/**`)\*\*: 90% (higher standard for shared utilities)

### Coverage Report

After running tests, view the coverage report:

```bash
open coverage/index.html
```

## Test Structure

### Unit & Component Tests (`src/components/__tests__/`, `src/lib/client/__tests__/`)

Jest-based tests using React Testing Library for component testing.

**Key Files:**

- `CreateProjectModal.test.js` - Multi-step modal flow, task management
- `DashboardClient.test.js` - Progress calculations, sorting, optimistic updates
- `ProfileClient.test.js` - User profile display, edit affordances
- `mergeProjectUpdate.test.js` - Client-side state merging (95% coverage)

**Run with:**

```bash
npm run test:unit
```

### Integration Tests (`tests/integration/`)

SQLite-based integration tests using factory helpers and auth mocks.

**Key Test Suites:**

- `api/projects.test.js` - Project CRUD with archived filtering
- `api/project-update.test.js` - Task synchronization (create/update/delete)
- `api/task-status.test.js` - Task status updates and audit metadata
- `api/project-order.test.js` - Reorder logic and ownership enforcement
- `setup/` - Test utilities (auth helpers, database reset, factories)

**Run with:**

```bash
npm run test:integration
```

### End-to-End Tests (`tests/e2e/`)

Playwright-based tests against a running Next.js dev server.

**Key Test Specs:**

- `auth-dashboard.spec.js` - Authentication flow and dashboard landing
- `project-lifecycle.spec.js` - Create, update, archive, restore projects
- `project-reorder.spec.js` - Drag-and-drop reordering with API verification
- `fixtures.js` - Shared test utilities for seeding users/sessions

**Run with:**

```bash
npm run test:e2e
```

## Test Utilities

### Auth Mocking (`tests/setup/auth-session.js`)

Deterministic test authentication without OAuth flow:

```javascript
import {
  createMockAuthSession,
  mockSessionUser,
} from "@/tests/setup/auth-session";

const session = createMockAuthSession({
  userId: "test-user-123",
  email: "test@example.com",
  name: "Test User",
});
```

Used in integration tests to bypass NextAuth without flakiness.

### Database Reset (`tests/setup/database.js`)

SQLite harness with truncate and seed helpers:

```javascript
import { resetDatabase, executeQuery } from "@/tests/setup/database";

beforeEach(async () => {
  await resetDatabase(); // Clears all tables
});
```

Ensures test isolation and reproducibility.

### Factory Builders (`tests/setup/factories.js`)

Deterministic test data creation:

```javascript
import {
  createUser,
  createProject,
  createTask,
  seedProjectWithTasks,
  seedUserWithProjects,
} from "@/tests/setup/factories";

const user = createUser({ name: "Alice" });
const project = seedProjectWithTasks({
  projectOverrides: { user_id: user.id },
  taskCount: 5,
});
```

## CI/CD Integration

### GitHub Actions Workflow

The `prebuild` script runs the full test suite before building:

```bash
npm run prebuild  # Runs: npm run test:all
npm run build     # Only succeeds if tests pass
```

### Running Tests in CI

```bash
# Non-interactive mode (for CI/CD environments)
npm run test:unit          # Unit tests with coverage
npm run test:integration   # Integration tests
npm run test:e2e           # E2E tests (requires npm run dev in background)
```

### Coverage Enforcement

Builds fail if coverage thresholds are not met:

- Missing 80% coverage → build fails
- Missing 90% in `src/lib/**` → build fails

Check coverage locally before pushing:

```bash
npm run test:unit
# Then open coverage/index.html
```

## Troubleshooting

### Common Issues

**Tests timeout in CI**

- Increase Jest timeout: `testTimeout: 15000` in `jest.config.cjs`
- Run integration tests separately: `npm run test:integration --maxWorkers=1`

**Flaky Playwright tests**

- Use auto-wait APIs (already configured)
- Increase timeout: `timeout: 30000` in `playwright.config.js`
- Check for deterministic seed data in fixtures

**Database connection errors**

- Ensure SQLite is writable: `chmod 644 horizon.db`
- Check `NODE_ENV=test` is set for test database path
- Clear stale database: `rm -f horizon.db`

**Auth session not working in integration tests**

- Verify `NEXTAUTH_TEST_TOKEN` env var is set
- Check test database includes users from `seedUserWithProjects`
- Use `createMockAuthSession` for deterministic auth

### Debug Mode

**Jest Debug**

```bash
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand
```

**Playwright Debug**

```bash
npm run test:e2e:ui
# Opens interactive Playwright inspector
```

**Database Inspection**

```bash
# Query test database directly
sqlite3 horizon.db "SELECT * FROM projects LIMIT 5;"
```

## Writing New Tests

### Unit/Component Test Template

```javascript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ComponentName", () => {
  test("does something meaningful", async () => {
    const user = userEvent.setup();
    render(<Component prop="value" />);

    await user.click(screen.getByRole("button", { name: /action/i }));

    await waitFor(() =>
      expect(screen.getByText("expected")).toBeInTheDocument()
    );
  });
});
```

### Integration Test Template for API Routes

```javascript
import { query, resetDatabase } from "@/lib/db";
import { seedUserWithProjects } from "@/tests/setup/factories";

describe("API Route Name", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  test("should test specific endpoint behavior", async () => {
    const { user, projects } = await seedUserWithProjects({
      projectCount: 1,
      taskCount: 2,
    });

    // Test database state directly
    const result = await query("SELECT * FROM projects WHERE user_id = ?", [
      user.id,
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(user.id);
  });
});
```

Key patterns:

- Always call `resetDatabase()` in `beforeEach`
- Use factory helpers for deterministic data
- Query database directly to verify state
- Test authorization boundaries
- Cover both success and error paths

### Adding New Project Integration Tests

When adding new project API tests, follow this structure:

1. **CRUD Tests** (`tests/integration/api/projects.test.js`):

   - Project listing with filters (archived, active)
   - Project creation with tasks
   - Authorization checks

2. **Update Tests** (`tests/integration/api/project-update.test.js`):

   - Project metadata updates
   - Task synchronization (create, update, delete)
   - Archive/restore operations

3. **Task Status Tests** (`tests/integration/api/task-status.test.js`):

   - Task status updates (Completed, In Progress, etc.)
   - Audit metadata persistence
   - Timestamp handling

4. **Project Order Tests** (`tests/integration/api/project-order.test.js`):
   - Display order updates
   - Ownership enforcement
   - Transaction handling

### E2E Test Template

```javascript
import { test, expect } from "@playwright/test";
import { loginAsTestUser, seedTestProject } from "./fixtures";

test("user workflow", async ({ page, context }) => {
  await loginAsTestUser(context);
  await page.goto("/dashboard");

  await expect(page.locator("text=Your Projects")).toBeVisible();
});
```

## Best Practices

1. **Isolation**: Each test should be independent (use `beforeEach` reset)
2. **Determinism**: Use factories and mocks to avoid flakiness
3. **Coverage**: Aim for >95% on critical paths (auth, data, UI flows)
4. **Performance**: Keep tests <1s each; cache expensive setup
5. **Maintenance**: Update tests when requirements change, not the other way around

## Performance Tips

- Run tests in parallel (default in Jest/Playwright)
- Use `--onlyChanged` to test only modified files locally
- Cache Node modules in CI: `npm ci --prefer-offline`
- Separate unit/integration/E2E tests by script

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Project README](./README.md) for setup instructions
