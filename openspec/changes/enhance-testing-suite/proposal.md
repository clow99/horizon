## Why

Current automated coverage is superficial: Jest only collects metrics for two helper files with a 20% threshold, integration tests exercise a single database helper, and end-to-end coverage is limited to the landing page. Critical production flows (project CRUD, task updates, authentication) ship without regression protection, and builds can succeed even when tests or coverage fail. We need a production-grade testing suite that enforces quality standards across the stack.

## What Changes

- Raise Jest coverage scope to the full `src/` tree with 80% global thresholds (and higher targets for persistence utilities) and gate the Next.js build behind the full suite.
- Expand unit and component coverage to high-impact UI features (project creation modal, dashboard progress, profile widgets) using React Testing Library patterns.
- Add integration tests for the project/task API routes, database helpers, and NextAuth callbacks using the SQLite harness and auth mocks.
- Broaden Playwright scenarios to cover authenticated project workflows (create, update, archive, reorder) with deterministic test credentials.
- Harden test utilities (auth stubs, database reset helpers, factory data) to support deterministic, parallel-friendly runs.
- Document the updated testing strategy and provide quick-start guidance for developers and CI/CD operators.

## Impact

- Affected specs: `testing-suite` (new capability)
- Affected code: `jest.config.cjs`, `package.json`, `jest.setup.js`, `tests/**/*`, `src/app/api/**/*`, `src/components/**/*`, `src/lib/db.js`, documentation (`TESTING_GUIDE.md`, `README.md`)
