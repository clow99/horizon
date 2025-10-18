## Why
Horizon only runs a single unauthenticated landing page Playwright spec and does not enforce E2E coverage as part of the build. Critical production flows (auth, project lifecycle, archiving, reordering) are untested in the browser, screenshots/traces are missing from CI artifacts, and the build can succeed even if the E2E suite is skipped. We need a production-grade Playwright implementation that hardens the build, records artifacts for debugging, and exercises the workflows teams rely on in production.

## What Changes
- Wire Playwright execution into the build so `npm run build` fails when E2E scenarios regress.
- Expand Playwright coverage to authenticated project workflows and regression guardrails for dashboard/table views.
- Capture deterministic screenshots, videos, and traces for every failure and on-demand checkpoints during long flows.
- Provide test data fixtures and auth helpers so Playwright specs can seed, reset, and reuse state safely.
- Document how to run, debug, and collect artifacts locally and in CI environments.

## Impact
- Affected specs: `playwright-suite` (new capability)
- Affected code: `package.json`, `playwright.config.js`, `tests/e2e/**/*`, `tests/setup/**/*`, documentation (`TESTING_GUIDE.md`, `README.md`), CI configuration if present.
