# Implementation Tasks: Add Production-Grade Testing Infrastructure

**Change ID**: `add-production-testing`  
**Status**: Pending Approval  
**Estimated Effort**: 12-18 hours

## Implementation Checklist

### Phase 1: Setup and Configuration (3-4 hours)

- [ ] **Task 1.1**: Install testing dependencies

  - Add Jest and related packages to package.json
  - Add React Testing Library packages
  - Add Playwright and browser binaries
  - Add better-sqlite3 for test database
  - Add Babel packages for transpilation
  - Run `npm install` to install all dependencies
  - **Validation**: Verify all packages in node_modules, no installation errors

- [ ] **Task 1.2**: Configure Jest

  - Create `jest.config.js` with jsdom environment
  - Configure module name mapper for Next.js path aliases (@/)
  - Set up test match patterns (\*.test.js)
  - Configure coverage collection and thresholds (80%)
  - Set up coverage exclusions (layout.js, generated files)
  - Configure transform with babel-jest
  - **Validation**: Run `npx jest --version` successfully, config loads without errors

- [ ] **Task 1.3**: Configure Babel for Jest

  - Create `babel.config.js` for Jest transpilation
  - Add @babel/preset-env for ES6+ syntax
  - Add @babel/preset-react for JSX
  - Configure for Next.js compatibility
  - **Validation**: Jest can transpile and run a simple test

- [ ] **Task 1.4**: Create Jest global setup

  - Create `jest.setup.js` file
  - Import @testing-library/jest-dom for DOM matchers
  - Configure test environment globals
  - Set up test timeouts if needed
  - **Validation**: Global matchers available in tests (toBeInTheDocument, etc.)

- [ ] **Task 1.5**: Configure Playwright

  - Create `playwright.config.js`
  - Configure browsers (Chromium, Firefox, WebKit)
  - Set base URL to localhost:3000
  - Configure headless mode for CI
  - Set up screenshot/video capture on failure
  - Configure parallel workers
  - Set test timeout to 30 seconds
  - **Validation**: Run `npx playwright --version`, config loads successfully

- [ ] **Task 1.6**: Update package.json scripts
  - Add `test` script: `jest --coverage`
  - Add `test:watch` script: `jest --watch`
  - Add `test:unit` script: Jest excluding integration/e2e
  - Add `test:integration` script: Jest for integration tests only
  - Add `test:e2e` script: `playwright test`
  - Add `test:e2e:ui` script: `playwright test --ui`
  - Add `test:all` script: runs test + test:e2e
  - Add `prebuild` hook: runs `npm run test:all`
  - Add `build:fast` script (optional): build without tests for local dev
  - **Validation**: Each script runs without errors (may have no tests yet)

### Phase 2: Test Infrastructure and Utilities (3-4 hours)

- [ ] **Task 2.1**: Create test directory structure

  - Create `tests/` directory in project root
  - Create `tests/setup/` for utilities
  - Create `tests/integration/` for integration tests
  - Create `tests/e2e/` for Playwright tests
  - Create `.gitkeep` files if needed
  - **Validation**: Directory structure matches design spec

- [ ] **Task 2.2**: Implement SQLite test database adapter

  - Create `tests/setup/database.js`
  - Implement `getTestDatabase()` function using better-sqlite3
  - Implement `resetTestDatabase()` for test isolation
  - Create `convertMySQLToSQLite()` function to translate schema
  - Read and convert `database/schema.sql` to SQLite DDL
  - Handle AUTO_INCREMENT → AUTOINCREMENT
  - Handle DATETIME/TIMESTAMP → TEXT
  - Handle TINYINT(1) → INTEGER
  - Implement table initialization on database creation
  - **Validation**: Create in-memory database, run schema, insert/query data successfully

- [ ] **Task 2.3**: Update db.js for test environment

  - Modify `src/lib/db.js` to detect NODE_ENV=test
  - Add conditional: if test, use SQLite; else use MySQL
  - Create `getSQLitePool()` helper
  - Ensure query() function works with both databases
  - Maintain existing MySQL behavior for production
  - **Validation**: Set NODE_ENV=test, verify SQLite is used; unset, verify MySQL is used

- [ ] **Task 2.4**: Create test data factories

  - Create `tests/setup/factories.js`
  - Implement `createUser(overrides)` factory with UUID, email, name
  - Implement `createProject(overrides)` factory with all required fields
  - Implement `createTask(overrides)` factory with UUID, status, category
  - Use uuid v4 for ID generation
  - Use realistic default values
  - Allow override of any field via parameter
  - **Validation**: Generate entities, verify all fields present, verify overrides work

- [ ] **Task 2.5**: Create authentication mocking utilities

  - Create `tests/setup/auth-helpers.js`
  - Implement `mockAuthSession(user)` to mock NextAuth auth() function
  - Implement `createTestSession(overrides)` to generate session objects
  - Use jest.spyOn to mock auth module
  - Ensure mock resets between tests
  - **Validation**: Mock session, verify API routes see authenticated user

- [ ] **Task 2.6**: Create custom Jest matchers

  - Create `tests/setup/custom-matchers.js`
  - Implement `toBeValidUUID()` matcher with regex validation
  - Implement `toHaveTaskStatus(status)` matcher
  - Implement `toBeArchivedProject()` matcher
  - Export matchers object
  - Import matchers in jest.setup.js
  - Extend expect with custom matchers
  - **Validation**: Use matchers in test, verify they work and give clear errors

- [ ] **Task 2.7**: Create test utilities and helpers
  - Create `tests/setup/helpers.js` for common utilities
  - Implement mock request builder for API route tests
  - Implement response parser for API responses
  - Implement date formatting helpers for test assertions
  - Add any other common test utilities
  - **Validation**: Import and use utilities in sample test

### Phase 3: Sample Tests - Unit Layer (2-3 hours)

- [ ] **Task 3.1**: Write utility function unit tests

  - Create `src/lib/client/__tests__/mergeProjectUpdate.test.js`
  - Test merging partial updates
  - Test date formatting logic
  - Test edge cases (empty updates, null values)
  - Achieve 90%+ coverage of the utility
  - **Validation**: Tests pass, coverage report shows 90%+

- [ ] **Task 3.2**: Write configuration unit tests

  - Create `src/config/__tests__/projectTypes.test.js`
  - Test project type retrieval by ID
  - Test default task templates
  - Verify all project types have required fields
  - **Validation**: Tests pass, verify config structure

- [ ] **Task 3.3**: Write React component unit tests

  - Create `src/components/__tests__/ThemeToggle.test.js`
  - Test component renders without crashing
  - Test theme toggle button interaction
  - Test theme state changes
  - Use React Testing Library (render, screen, fireEvent)
  - **Validation**: Tests pass, component behavior verified

- [ ] **Task 3.4**: Write Toast component unit tests
  - Create `src/components/__tests__/Toast.test.js`
  - Test toast displays with message
  - Test auto-dismiss after timeout
  - Test manual dismiss on close click
  - Test different toast types (success, error)
  - **Validation**: Tests pass, all toast behaviors covered

### Phase 4: Sample Tests - Integration Layer (2-3 hours)

- [ ] **Task 4.1**: Write projects API integration tests

  - Create `tests/integration/api/projects.test.js`
  - Set up beforeEach with resetTestDatabase() and mockAuthSession()
  - Test GET /api/projects returns user's projects only
  - Test POST /api/projects creates project with tasks
  - Test project filtering (archived parameter)
  - Test authorization (401 without auth)
  - Test validation (400 for invalid input)
  - **Validation**: All tests pass, database operations work, isolation verified

- [ ] **Task 4.2**: Write tasks API integration tests

  - Create `tests/integration/api/tasks.test.js`
  - Test GET /api/projects/[id]/tasks returns tasks
  - Test POST creates new task
  - Test PATCH updates task status and fields
  - Test DELETE removes task
  - Test task belongs to correct project
  - Test user authorization for task operations
  - **Validation**: All CRUD operations work, authorization enforced

- [ ] **Task 4.3**: Write database query integration tests

  - Create `tests/integration/database/queries.test.js`
  - Test complex queries (joins, filters, sorting)
  - Test project with tasks retrieval
  - Test task completion statistics
  - Test archived project filtering
  - Verify data integrity and relationships
  - **Validation**: All queries return correct data, foreign keys work

- [ ] **Task 4.4**: Write user profile integration tests
  - Create `tests/integration/api/user-profile.test.js`
  - Test GET /api/user/profile returns user data
  - Test user creation on first OAuth login
  - Test user data updates
  - **Validation**: User operations work correctly

### Phase 5: Sample Tests - E2E Layer (2-3 hours)

- [ ] **Task 5.1**: Write authentication E2E test

  - Create `tests/e2e/auth-flow.spec.js`
  - Test landing page loads
  - Test sign-in button click
  - Mock or setup OAuth flow (use test account or mock)
  - Test redirect to dashboard after auth
  - Test sign-out flow
  - **Validation**: Auth flow completes successfully in browser

- [ ] **Task 5.2**: Write project management E2E test

  - Create `tests/e2e/project-management.spec.js`
  - Test creating new project with default tasks
  - Test creating empty project
  - Test editing project details (name, description, date)
  - Test deleting project
  - Test project archive/restore
  - **Validation**: All project operations work in real browser

- [ ] **Task 5.3**: Write task completion E2E test

  - Create `tests/e2e/task-completion.spec.js`
  - Test checking off task updates progress
  - Test changing task status via dropdown
  - Test adding custom task to project
  - Test editing task details
  - Test deleting task
  - Test required vs optional task badges
  - **Validation**: All task interactions work, UI updates correctly

- [ ] **Task 5.4**: Write table view E2E test
  - Create `tests/e2e/table-view.spec.js`
  - Test switching to table view
  - Test batch task completion across projects
  - Test category filtering
  - Test grouping (by task vs by category)
  - Test project archiving from table view
  - **Validation**: Table view works, batch operations succeed

### Phase 6: Documentation and Finalization (2-3 hours)

- [ ] **Task 6.1**: Create testing guide documentation

  - Create `TESTING_GUIDE.md` in project root
  - Document how to run tests (unit, integration, e2e, all)
  - Explain test structure and conventions
  - Provide examples for each test type
  - Document test utilities and factories
  - Explain coverage requirements and how to check
  - Add troubleshooting section
  - Include debugging tips for each test type
  - **Validation**: New developer can follow guide to write first test

- [ ] **Task 6.2**: Add testing section to main README

  - Update `README.md` with testing overview
  - Add "Testing" section with npm commands
  - Link to TESTING_GUIDE.md for details
  - Add testing badge (optional)
  - **Validation**: README clearly documents testing capability

- [ ] **Task 6.3**: Update project.md with testing info

  - Update `openspec/project.md` testing strategy section
  - Document Jest/Playwright/SQLite tech choices
  - Update conventions to include test patterns
  - Note coverage requirements
  - **Validation**: project.md accurately reflects new testing setup

- [ ] **Task 6.4**: Create .gitignore entries for test artifacts

  - Add `coverage/` to .gitignore
  - Add `playwright-report/` to .gitignore
  - Add `test-results/` to .gitignore
  - Add `.playwright/` to .gitignore (browser cache)
  - **Validation**: Test artifacts not tracked in git

- [ ] **Task 6.5**: Run full test suite and verify coverage

  - Run `npm test` and verify all tests pass
  - Verify coverage meets 80% threshold for tested modules
  - Run `npm run test:e2e` and verify E2E tests pass
  - Run `npm run build` and verify tests run in prebuild
  - Check that build fails if tests fail
  - Review coverage report for any gaps
  - **Validation**: All tests green, coverage at target, build integration works

- [ ] **Task 6.6**: Performance optimization (if needed)
  - Profile test execution time
  - Identify slow tests (>1s for unit, >5s for integration)
  - Optimize test setup/teardown
  - Consider parallelization if needed
  - Target: full suite under 90 seconds
  - **Validation**: Test suite meets performance targets

### Phase 7: Final Validation and Cleanup

- [ ] **Task 7.1**: Manual testing of test suite

  - Run tests on clean checkout
  - Verify tests work without dev database running
  - Test watch mode (`npm run test:watch`)
  - Test E2E UI mode (`npm run test:e2e:ui`)
  - Verify coverage HTML report opens
  - **Validation**: Everything works as documented

- [ ] **Task 7.2**: CI/CD integration verification

  - Document environment variables needed for tests
  - Test build script with failing test (should fail build)
  - Test build script with passing tests (should succeed)
  - Verify exit codes are correct (0 for pass, 1 for fail)
  - **Validation**: Build process correctly gates on tests

- [ ] **Task 7.3**: Code review and cleanup

  - Review all test code for quality
  - Ensure tests follow conventions
  - Remove commented code or debug logs
  - Verify all files have consistent formatting
  - Run linter on test files
  - **Validation**: Test code meets quality standards

- [ ] **Task 7.4**: Final documentation review
  - Proofread TESTING_GUIDE.md
  - Verify all commands work as documented
  - Check for broken links or references
  - Ensure examples are accurate
  - **Validation**: Documentation is clear and accurate

## Success Criteria

All tasks completed when:

✅ Jest, React Testing Library, and Playwright installed and configured  
✅ In-memory SQLite database works for integration tests  
✅ Test utilities, factories, and helpers created and functional  
✅ Sample tests written for unit, integration, and E2E layers  
✅ Coverage reporting enabled with 80% threshold enforced  
✅ Tests integrated into build pipeline (prebuild hook)  
✅ All sample tests passing  
✅ Full test suite runs in under 90 seconds  
✅ TESTING_GUIDE.md provides clear instructions  
✅ Build fails when tests fail, succeeds when tests pass  
✅ Documentation updated to reflect testing capabilities

## Dependencies Between Tasks

- Tasks 1.1-1.6 must complete before other phases (setup required)
- Task 2.2 and 2.3 (database) must complete before integration tests (4.x)
- Task 2.4 and 2.5 (factories/auth) must complete before integration tests
- All Phase 3, 4, 5 tasks can proceed in parallel after Phase 2 completes
- Phase 6 should start after some tests exist (can be parallel with test writing)
- Phase 7 is final validation after all other phases complete

## Rollback Plan

If issues arise during implementation:

1. Tests can be disabled by removing prebuild hook temporarily
2. Individual test files can be skipped with `.skip()`
3. Coverage threshold can be lowered temporarily
4. E2E tests can be disabled if unstable (keep unit/integration)
5. Full rollback: remove test dependencies, delete test files, revert package.json

## Notes for Implementation

- Start with simplest tests first (utilities) to validate setup
- Use TDD approach: write test, watch fail, implement, watch pass
- Commit after each completed phase for easy rollback
- Run tests frequently during development
- Update documentation as you discover issues or improvements
- Ask for help if SQLite schema conversion has issues
- Playwright may need additional browser setup on first run
- Consider test data size - keep factories minimal for speed
