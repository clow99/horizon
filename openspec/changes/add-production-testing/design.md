# Technical Design: Production-Grade Testing Infrastructure

**Change ID**: `add-production-testing`  
**Last Updated**: 2025-10-14

## Architecture Overview

This design implements a three-tier testing architecture for the Horizon application:

```
┌─────────────────────────────────────────────────────────────┐
│                     Testing Pyramid                          │
├─────────────────────────────────────────────────────────────┤
│  E2E Tests (Playwright)                                      │
│  - Complete user workflows                                   │
│  - Browser automation                                        │
│  - 5-10% of test suite                                      │
├─────────────────────────────────────────────────────────────┤
│  Integration Tests (Jest + SQLite)                          │
│  - API endpoints                                            │
│  - Database operations                                       │
│  - Multi-component interactions                              │
│  - 20-30% of test suite                                     │
├─────────────────────────────────────────────────────────────┤
│  Unit Tests (Jest + React Testing Library)                  │
│  - Functions and utilities                                   │
│  - React components                                          │
│  - Business logic                                            │
│  - 60-75% of test suite                                     │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Testing Framework: Jest

**Why Jest?**

- User requirement (explicitly requested)
- Mature ecosystem with extensive community support
- Excellent React/Next.js integration
- Built-in coverage reporting
- Snapshot testing capabilities
- Powerful mocking system

**Configuration Strategy**:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "jsdom", // For React component tests
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // Match Next.js path aliases
  },
  testMatch: ["**/__tests__/**/*.test.js", "**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/**/*.test.{js,jsx}",
    "!src/app/**/layout.js",
    "!src/app/**/page.js", // E2E covers pages
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  transform: {
    "^.+\\.(js|jsx)$": ["babel-jest", { configFile: "./babel.config.js" }],
  },
};
```

### Component Testing: React Testing Library

**Why React Testing Library?**

- User-centric testing approach (test what users see)
- Encourages accessibility best practices
- Avoids testing implementation details
- Standard in modern React development

**Testing Patterns**:

```javascript
// Example: Testing a component
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/ThemeToggle";

test("toggles theme when clicked", () => {
  render(<ThemeToggle />);
  const button = screen.getByRole("button", { name: /toggle theme/i });
  fireEvent.click(button);
  // Assert theme changed
});
```

### E2E Testing: Playwright

**Why Playwright?**

- Modern, fast, reliable browser automation
- Auto-wait reduces flaky tests
- Multi-browser support (Chromium, Firefox, WebKit)
- Built-in test runner with parallel execution
- Excellent debugging tools

**Test Structure**:

```javascript
// tests/e2e/auth-flow.spec.js
import { test, expect } from "@playwright/test";

test("user can sign in and create project", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.click("text=Sign In");
  // Test authentication flow
  await expect(page).toHaveURL(/.*dashboard/);
});
```

## Test Database Strategy

### In-Memory SQLite with better-sqlite3

**Why SQLite for tests?**

- Fast: No network I/O, in-memory execution
- Isolated: Each test gets fresh database
- Simple: No external services or Docker required
- Compatible: SQL is mostly portable from MySQL

**Implementation Approach**:

1. **Database Adapter Pattern**

   ```javascript
   // src/lib/db.js (enhanced)
   export function getPool() {
     if (process.env.NODE_ENV === "test") {
       return getSQLitePool();
     }
     return getMySQLPool();
   }
   ```

2. **Schema Translation**

   - Convert MySQL DDL to SQLite-compatible DDL
   - Handle MySQL-specific types (DATETIME → TEXT)
   - Map AUTO_INCREMENT to SQLite AUTOINCREMENT
   - Adapt foreign key syntax

3. **Test Database Lifecycle**

   ```javascript
   // tests/setup/database.js
   beforeEach(async () => {
     // Create fresh database
     await resetTestDatabase();
   });

   afterEach(async () => {
     // Clean up
     await closeTestDatabase();
   });
   ```

**Trade-offs**:

- ✅ Pro: Fast, simple, no dependencies
- ✅ Pro: True database queries (not mocked)
- ⚠️ Con: MySQL-specific features may behave differently
- ⚠️ Con: Need to maintain schema compatibility

**Mitigation**: Document MySQL-specific features and test production-specific queries manually.

## Test Organization

### Directory Structure

```
horizon/
├── src/
│   ├── app/                      # Next.js pages
│   ├── components/               # React components
│   │   ├── ThemeToggle.js
│   │   └── __tests__/           # Component tests
│   │       └── ThemeToggle.test.js
│   ├── lib/                      # Utilities
│   │   ├── db.js
│   │   └── __tests__/           # Unit tests
│   │       └── db.test.js
│   └── config/
│       └── __tests__/
└── tests/
    ├── setup/                    # Test utilities
    │   ├── database.js          # SQLite setup
    │   ├── factories.js         # Test data builders
    │   ├── auth-helpers.js      # Auth mocking
    │   └── custom-matchers.js   # Jest extensions
    ├── integration/              # Integration tests
    │   ├── api/
    │   │   ├── projects.test.js
    │   │   └── tasks.test.js
    │   └── database/
    │       └── queries.test.js
    └── e2e/                      # Playwright tests
        ├── auth-flow.spec.js
        ├── project-management.spec.js
        └── task-completion.spec.js
```

### Naming Conventions

- **Unit/Integration**: `*.test.js` (Jest discovers these)
- **E2E**: `*.spec.js` (Playwright convention)
- **Test suites**: `describe('ComponentName', () => {})`
- **Test cases**: `test('should do something', () => {})`
- **Factories**: `create{Entity}()` (e.g., `createProject()`)

## Test Utilities & Helpers

### 1. Test Data Factories

**Purpose**: Generate realistic test data consistently

```javascript
// tests/setup/factories.js
import { v4 as uuidv4 } from "uuid";

export function createUser(overrides = {}) {
  return {
    id: uuidv4(),
    email: "test@example.com",
    name: "Test User",
    image: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createProject(overrides = {}) {
  return {
    id: uuidv4(),
    user_id: uuidv4(),
    name: "Test Project",
    description: "Test description",
    client: "Test Client",
    target_date: "2025-12-31",
    status: "Planning",
    archived: 0,
    ...overrides,
  };
}

export function createTask(overrides = {}) {
  return {
    id: uuidv4(),
    project_id: uuidv4(),
    name: "Test Task",
    description: "Test description",
    category: "Infrastructure",
    status: "Not Started",
    required: 1,
    ...overrides,
  };
}
```

### 2. Database Test Helpers

```javascript
// tests/setup/database.js
import Database from "better-sqlite3";
import { readFileSync } from "fs";

let db;

export function getTestDatabase() {
  if (!db) {
    db = new Database(":memory:");
    initializeSchema();
  }
  return db;
}

export function resetTestDatabase() {
  if (db) {
    db.close();
    db = null;
  }
  return getTestDatabase();
}

function initializeSchema() {
  const schema = convertMySQLToSQLite(
    readFileSync("./database/schema.sql", "utf8")
  );
  db.exec(schema);
}

function convertMySQLToSQLite(mysqlSchema) {
  return mysqlSchema
    .replace(/AUTO_INCREMENT/g, "AUTOINCREMENT")
    .replace(/DATETIME/g, "TEXT")
    .replace(/TIMESTAMP/g, "TEXT")
    .replace(/TINYINT\(1\)/g, "INTEGER");
  // ... more conversions
}
```

### 3. Authentication Mocking

```javascript
// tests/setup/auth-helpers.js
import { auth } from "@/auth";

export function mockAuthSession(user = null) {
  jest.spyOn(auth, "auth").mockResolvedValue(user ? { user } : null);
}

export function createTestSession(overrides = {}) {
  return {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      ...overrides,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}
```

### 4. Custom Jest Matchers

```javascript
// tests/setup/custom-matchers.js
export const customMatchers = {
  toBeValidUUID(received) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () => `expected ${received} to be a valid UUID v4`,
    };
  },

  toHaveTaskStatus(received, expectedStatus) {
    const pass = received.status === expectedStatus;
    return {
      pass,
      message: () =>
        `expected task status to be ${expectedStatus}, got ${received.status}`,
    };
  },
};
```

## CI/CD Integration

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:unit": "jest --testPathIgnorePatterns=integration,e2e",
    "test:integration": "jest tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e",
    "prebuild": "npm run test:all",
    "build": "next build",
    "predeploy": "npm run test:all"
  }
}
```

### Build Pipeline Integration

```
┌─────────────┐
│  Git Push   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Install Deps│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Run Jest   │◄── Unit + Integration Tests
│  (80% cov)  │    If fails, stop build
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Run E2E     │◄── Playwright tests
│ (Playwright)│    If fails, stop build
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Build Next  │
│   (Turbo)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Deploy    │
└─────────────┘
```

**Failure Handling**: Any test failure exits with non-zero code, blocking deployment.

## Coverage Strategy

### 80% Target Distribution

| Layer       | Coverage Target | Priority Areas                |
| ----------- | --------------- | ----------------------------- |
| Utilities   | 90%+            | `src/lib/**`, `src/config/**` |
| Components  | 80%+            | Critical UI components        |
| API Routes  | 85%+            | All endpoints (auth required) |
| Integration | 80%+            | Database operations           |
| Pages       | 50%+            | E2E covers most page logic    |

### Exclusions

- Next.js generated files (`layout.js` boilerplate)
- Configuration files
- Type definitions (if TypeScript added later)
- Test files themselves

### Coverage Enforcement

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80
  },
  './src/lib/**/*.js': {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90
  }
}
```

## Sample Test Patterns

### Unit Test Example

```javascript
// src/lib/client/__tests__/mergeProjectUpdate.test.js
import { mergeProjectUpdate } from "../mergeProjectUpdate";

describe("mergeProjectUpdate", () => {
  test("should merge partial updates into project", () => {
    const project = { id: "1", name: "Old Name", status: "Planning" };
    const updates = { name: "New Name" };

    const result = mergeProjectUpdate(project, updates);

    expect(result.name).toBe("New Name");
    expect(result.status).toBe("Planning"); // Unchanged
  });

  test("should format target_date correctly", () => {
    const project = { id: "1", target_date: "2025-01-01" };
    const updates = { target_date: "2025-12-31" };

    const result = mergeProjectUpdate(project, updates);

    expect(result.target_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

### Integration Test Example

```javascript
// tests/integration/api/projects.test.js
import { GET, POST } from "@/app/api/projects/route";
import { mockAuthSession, createTestSession } from "@/tests/setup/auth-helpers";
import { resetTestDatabase } from "@/tests/setup/database";
import { createProject } from "@/tests/setup/factories";

describe("Projects API", () => {
  beforeEach(async () => {
    await resetTestDatabase();
    mockAuthSession(createTestSession());
  });

  describe("GET /api/projects", () => {
    test("returns user projects only", async () => {
      const session = createTestSession({ id: "user-1" });
      mockAuthSession(session);

      // Create projects for this user and another
      await createProject({ user_id: "user-1", name: "My Project" });
      await createProject({ user_id: "user-2", name: "Other Project" });

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].name).toBe("My Project");
    });
  });

  describe("POST /api/projects", () => {
    test("creates project with tasks", async () => {
      const request = new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: "New Project",
          tasks: [{ name: "Task 1", category: "Infrastructure" }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.project.id).toBeValidUUID();
      expect(data.project.name).toBe("New Project");
      expect(data.tasks).toHaveLength(1);
    });
  });
});
```

### E2E Test Example

```javascript
// tests/e2e/project-management.spec.js
import { test, expect } from "@playwright/test";

test.describe("Project Management", () => {
  test.beforeEach(async ({ page }) => {
    // Assume auth is set up
    await page.goto("http://localhost:3000/dashboard");
  });

  test("create project with default tasks", async ({ page }) => {
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', "Test Project");
    await page.click('button:has-text("With Default Tasks")');
    await page.click('button:has-text("Create")');

    await expect(page.locator("text=Test Project")).toBeVisible();
    await expect(page.locator(".task-item")).toHaveCount(18);
  });

  test("complete task updates progress", async ({ page }) => {
    const firstTask = page.locator(".task-item").first();
    const checkbox = firstTask.locator('input[type="checkbox"]');

    await checkbox.check();

    await expect(checkbox).toBeChecked();
    await expect(page.locator(".progress-text")).toContainText("1 / ");
  });
});
```

## Performance Considerations

### Test Execution Speed

**Target Times**:

- Unit tests: < 5 seconds total
- Integration tests: < 15 seconds total
- E2E tests: < 60 seconds total
- Full suite: < 90 seconds

**Optimization Strategies**:

1. SQLite in-memory (no disk I/O)
2. Parallel test execution where safe
3. Minimal setup/teardown
4. Mock external services
5. Playwright parallel workers

### Build Time Impact

**Before**: `npm run build` ≈ 10-20 seconds  
**After**: `npm run build` ≈ 90-120 seconds (includes tests)

**Options**:

- `npm run build:fast` - Skip tests (dev only)
- `npm run test:changed` - Run only changed tests (future)

## Maintenance & Best Practices

### Writing Good Tests

1. **Test Behavior, Not Implementation**

   - ✅ Test what the user sees/does
   - ❌ Test internal component state

2. **Keep Tests Simple**

   - One assertion per test (when possible)
   - Clear test names
   - Arrange-Act-Assert pattern

3. **Avoid Test Coupling**

   - Each test should run independently
   - No shared mutable state
   - Use factories for fresh data

4. **Mock External Dependencies**
   - API calls to external services
   - File system operations (except SQLite)
   - Time-dependent operations

### Test Maintenance

- Update tests when requirements change
- Delete tests for removed features
- Refactor tests when code refactors
- Keep test utilities DRY

## Future Enhancements

Deferred to later phases:

1. **Visual Regression Testing**: Percy, Chromatic, or Playwright screenshots
2. **Performance Testing**: Lighthouse CI, load testing
3. **Security Testing**: OWASP ZAP, npm audit in tests
4. **Mutation Testing**: Stryker.js for test quality
5. **Parallel Optimization**: Sharding, distributed execution
6. **Test Data Generation**: Faker.js for realistic data
7. **Contract Testing**: Pact for API contracts

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
