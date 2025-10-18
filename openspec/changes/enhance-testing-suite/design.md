## Context

The repository already includes Jest, Playwright, and SQLite test utilities, but coverage is limited to a handful of helpers and UI smoke checks. Critical API routes, database migration logic, and complex client components (e.g., `CreateProjectModal`) lack automated verification. Coverage thresholds are set to 20%, and `npm run build` does not block on test failures, allowing regressions to reach production. We need to extend the existing tooling into a cohesive, repeatable suite that exercises the core Horizon workflows under deterministic conditions.

## Goals / Non-Goals

- Goals:
  - Enforce 80%+ coverage across the `src/` tree with elevated thresholds for persistence utilities.
  - Cover the happy path and key failure modes for project/task APIs, dashboard progress, and profile experiences.
  - Provide authenticated E2E coverage for creating, updating, reordering, and archiving projects.
  - Ship helper utilities (auth stubs, database resets, data factories) that keep tests isolated and stable.
  - Integrate the full suite into CI/CD and developer workflows with clear documentation.
- Non-Goals:
  - Rewrite application architecture or migrate away from Jest/Playwright.
  - Achieve 100% coverage of every component (focus on high-impact and regression-prone surfaces).
  - Introduce mutation or performance testing at this stage.

## Decisions

- **Coverage Enforcement**: Collect coverage from `src/**/*.{js,jsx}` and enforce 80% global / 90% for `src/lib/**` to guard database/auth logic. Rationale: ensures breadth without stalling progress on complex UI edge cases.
- **Test Segmentation**: Keep unit/component tests under Jest, integration tests under `tests/integration`, and E2E flows under Playwright. Rationale: preserves existing tooling while clarifying ownership.
- **Auth Stubbing**: Introduce a deterministic test identity via an overrideable `NEXTAUTH_TEST_TOKEN` and helper that bypasses Google OAuth in both Jest and Playwright. Rationale: avoids flaky OAuth flows while still exercising authorization logic.
- **Database Reset**: Expand the SQLite harness to truncate all tables between tests and seed baseline entities on demand. Rationale: deterministic data keeps integration tests parallel-friendly and reproducible.
- **Playwright Strategy**: Run headless flows against the Next.js dev server with a dedicated `/tests-login` helper route only mounted in `NODE_ENV=test`. Rationale: reduces coupling to NextAuth internals and keeps production server untouched.

## Risks / Trade-offs

- **Longer Build Times** → Mitigation: parallelize Playwright workers, gate E2E behind dedicated script invoked by `prebuild` but cache node_modules in CI.
- **Flaky Browser Tests** → Mitigation: use Playwright auto-wait APIs, consistent seed data, and deterministic auth stub.
- **Schema Drift Between MySQL and SQLite** → Mitigation: expand schema conversion coverage and add integration assertions against critical constraints.
- **Developer Onboarding Overhead** → Mitigation: update `TESTING_GUIDE.md` with quick commands and troubleshooting tips.

## Migration Plan

1. Update Jest config, coverage collection, and scripts while keeping existing tests green.
2. Build out test utilities (auth stub, data factories, DB reset) and refactor existing tests to use them.
3. Add new unit/component tests, then integration tests for APIs using SQLite harness.
4. Implement authenticated Playwright flows, adjusting Next.js test server as needed.
5. Wire `prebuild` to `npm run test:all`, update docs, and ensure CI instructions cover dependencies.

## Open Questions

- Do we need to support running the full Playwright suite in parallel across browsers in CI, or is Chromium-only acceptable initially?
- Should coverage thresholds differ between server and client code (e.g., higher for pure utilities)?
- Are there existing CI pipelines we must integrate with (GitHub Actions vs. another provider)?
