## 1. Framework Hardening

- [x] 1.1 Update `jest.config.cjs` to collect coverage from `src/**/*.{js,jsx}` with global 80% thresholds (90% for `src/lib/**`) and exclude generated files; verify `npx jest --coverage --runTestsByPath src/lib/client/mergeProjectUpdate.test.js` passes (currently fails due to low coverage, confirming the new gate).
- [x] 1.2 Add a `prebuild` script that runs `npm run test:all` and ensure `npm run build` fails when any suite fails (coverage gate now blocks the build until broader tests land).
- [x] 1.3 Expand `jest.setup.js` to register new helpers/matchers and ensure environment variables required by tests are set without leaking into non-test runs.

## 2. Test Utilities

- [x] 2.1 Extend `tests/setup/database.js` with explicit truncate helpers and deterministic seed utilities; prove they work by inserting and clearing sample data in a throwaway test.
- [x] 2.2 Implement `tests/setup/auth-session.js` (or augment existing helpers) to provide deterministic authenticated/unauthenticated contexts for both Jest and Playwright; confirm via a minimal auth-dependent test.
- [x] 2.3 Create shared factory builders for projects with nested tasks and reusable mock request/response helpers under `tests/setup/`.

## 3. Unit & Component Coverage

- [x] 3.1 Add React Testing Library coverage for `CreateProjectModal` (multi-step flow, custom task add/remove) and ensure state resets on close.
- [x] 3.2 Cover dashboard progress logic (`DashboardClient` or dedicated hooks) verifying percent calculations, archived filtering, and optimistic updates.
- [x] 3.3 Add tests for profile widgets (`ProfileClient` or related components) validating display of user metadata and edit affordances.
- [x] 3.4 Increase utility coverage for `src/lib/client/mergeProjectUpdate.js` edge cases (partial updates, task merging) to reach 95% for that module.

## 4. Integration Tests

- [x] 4.1 Create `tests/integration/api/projects.test.js` covering GET (with archived filters) and POST (with tasks) using auth mocks and SQLite harness.
- [x] 4.2 Add `tests/integration/api/project-update.test.js` validating PUT/DELETE behavior, task synchronization (create/update/delete), and authorization failures.
- [x] 4.3 Add `tests/integration/api/task-status.test.js` covering PATCH updates, required field validation, and audit metadata persistence.
- [x] 4.4 Add `tests/integration/api/project-order.test.js` verifying reorder logic, ownership enforcement, and invalid payload handling.
- [x] 4.5 Cover NextAuth callbacks (`src/auth.js`) to ensure new/existing users are handled correctly under SQLite; mock query responses where necessary.

## 5. End-to-End Flows

- [x] 5.1 Introduce a test-only login helper route or Playwright fixture that seeds a user/session, then write an auth flow spec that lands on the dashboard.
- [x] 5.2 Implement a Playwright spec that creates a project from a template, verifies preset tasks, toggles statuses, and observes progress updates.
- [x] 5.3 Add a Playwright spec for archiving/restoring a project and ensuring it disappears/reappears in the dashboard and table view.
- [x] 5.4 Add a Playwright spec for drag-and-drop project reordering (or equivalent UI interaction), verifying persisted order via API.

## 6. Documentation & Finalization

- [x] 6.1 Update `TESTING_GUIDE.md` and `README.md` with new commands, auth stubs, CI tips, and troubleshooting.
- [x] 6.2 Add `.gitignore` entries for new artifacts (Playwright traces, screenshots) if missing.
- [x] 6.3 Run `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`, and `npm run build` to confirm all suites pass and coverage thresholds are satisfied.
