## 1. Build Integration
- [ ] 1.1 Add a `test:e2e` npm script that runs Playwright with CI-friendly defaults and artifacts directory configuration.
- [ ] 1.2 Update the build pipeline (`prebuild` or equivalent) to execute `npm run test:e2e` alongside existing suites and fail on regression.
- [ ] 1.3 Verify `npm run build` aborts when a Playwright spec fails and passes when the suite succeeds.

## 2. Test Harness
- [ ] 2.1 Implement deterministic auth/session fixtures so Playwright can authenticate without third-party redirects.
- [ ] 2.2 Provide reusable seed/reset helpers that ensure database state is isolated per spec and reset between tests.
- [ ] 2.3 Configure artifact retention (screenshots, videos, traces) with per-run directories and CI-friendly naming.

## 3. Scenario Coverage
- [ ] 3.1 Add specs for login + dashboard readiness, including smoke checks for key widgets.
- [ ] 3.2 Add specs that create projects from templates, add custom tasks, toggle statuses, and verify live progress updates.
- [ ] 3.3 Add specs that archive/restore projects and confirm visibility in dashboard and table views.
- [ ] 3.4 Add specs that reorder projects (drag-and-drop or command alternative) and assert persistence via API or UI refresh.
- [ ] 3.5 Ensure each scenario captures targeted checkpoints (before submit, after success) via `page.screenshot()` when `PLAYWRIGHT_CAPTURE=verbose`.

## 4. Documentation & Tooling
- [ ] 4.1 Update `TESTING_GUIDE.md` and `README.md` with Playwright prerequisites, commands, artifact locations, and troubleshooting.
- [ ] 4.2 Add `.gitignore` entries for Playwright artifact directories if missing.
- [ ] 4.3 Document CI integration steps (env variables, base URL overrides) and confirm artifacts upload configuration.
