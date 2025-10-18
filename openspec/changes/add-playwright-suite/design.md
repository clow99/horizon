## Context
The current Playwright footprint is a single unauthenticated landing-page smoke test that runs manually. There is no deterministic way to authenticate, seed data, or capture artifacts, and the build does not fail when E2E flows regress. Introducing a production-ready suite requires hardening the Playwright harness, integrating it into the build, and defining a reliable strategy for auth, data isolation, and artifact capture.

## Goals / Non-Goals
- Goals: provide deterministic authenticated flows, integrate Playwright into build/CI, capture screenshots/videos/traces, and cover critical project lifecycle scenarios.
- Non-Goals: replace existing Jest/integration coverage, implement visual regression comparison tooling, or migrate the entire CI pipeline.

## Decisions
- Decision: Use a Playwright test fixture that seeds a session cookie or NextAuth JWT directly to bypass third-party redirects, ensuring fast and reliable auth.
  - Alternatives considered: Driving Google OAuth UI (slow, flaky) or reusing the API login endpoint (not available). Direct session seeding keeps tests stable.
- Decision: Store artifacts (screenshots, videos, traces) under `artifacts/playwright/<run-timestamp>/` so CI can collect them and developers can inspect locally.
  - Alternatives considered: default `.playwright-artifacts` folder (not clearly scoped per run). Dedicated directory avoids accidental commits and eases cleanup.
- Decision: Gate `npm run build` through `npm run test:e2e` via `prebuild` so production builds always execute Playwright alongside unit/integration suites.
  - Alternatives considered: optional CI-only stage. Build gating ensures local builds mirror CI expectations.
- Decision: Expose `PLAYWRIGHT_CAPTURE` env toggle (`minimal`, `failure`, `verbose`) to control additional checkpoint screenshots without editing specs.
  - Alternatives considered: unconditional screenshot capture (heavy storage) or manual command flags (inconsistent). An env toggle balances visibility and storage.

## Risks / Trade-offs
- Additional build time from running Playwright; mitigated with selective worker count and headless execution.
- Potential flakiness from data seeding; mitigated by explicit reset utilities and timeouts tuned for SSR.
- Artifact growth in CI; mitigated by pruning old runs and scoping to failures unless verbose mode requested.

## Migration Plan
1. Add npm scripts and update `playwright.config.js` for artifact directories and worker defaults.
2. Build authentication and database helper fixtures supporting deterministic state.
3. Author the new specs incrementally, validating each against local build gating.
4. Update documentation and CI recipes before enabling failure-gating in main branch.

## Open Questions
- Should verbose screenshot capture be enabled by default in CI, or only on demand?
- Do we need to support running Playwright against deployed staging environments via configurable base URLs?
