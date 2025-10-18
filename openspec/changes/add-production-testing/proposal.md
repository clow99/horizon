# Add Production-Grade Testing Infrastructure

**Change ID**: `add-production-testing`  
**Status**: Proposed  
**Created**: 2025-10-14  
**Owner**: Development Team

## Problem Statement

Horizon currently lacks automated testing infrastructure, relying entirely on manual testing workflows. This creates several risks and inefficiencies:

1. **Quality Assurance Gaps**: No systematic validation of code changes before deployment
2. **Regression Risk**: Changes can break existing functionality without detection
3. **Deployment Confidence**: Manual testing is time-consuming and error-prone
4. **Developer Velocity**: Developers cannot quickly verify their changes work correctly
5. **Refactoring Barriers**: Without tests, code improvements carry high risk
6. **API Contract Validation**: No automated verification of API endpoints and database operations
7. **User Flow Validation**: Critical user journeys (auth, project creation, task management) are not systematically tested

The current `package.json` shows no testing dependencies, and the project structure contains no test files. The `openspec/project.md` explicitly documents "Manual testing workflow (no automated tests currently)".

## Proposed Solution

Implement a comprehensive, production-grade testing infrastructure covering three layers:

1. **Unit Tests**: Test individual functions, utilities, and React components in isolation
2. **Integration Tests**: Test API endpoints, database operations, and multi-component interactions
3. **End-to-End Tests**: Test complete user workflows from authentication through task management

### Key Technical Decisions

- **Testing Framework**: Jest (as requested) with React Testing Library for component tests
- **E2E Framework**: Playwright for browser automation and user flow testing
- **Test Database**: In-memory SQLite for fast, isolated test execution
- **Coverage Target**: 80% minimum coverage across statements, branches, functions, and lines
- **CI/CD Integration**: Tests integrated into build scripts with automatic failure blocking

## Scope

### In Scope

- Jest configuration and setup with Babel/SWC for Next.js compatibility
- React Testing Library setup for component testing
- Playwright setup for E2E testing
- In-memory SQLite test database with schema migration
- Test utilities and helpers (mock factories, test data builders, custom matchers)
- Coverage reporting and enforcement (80% threshold)
- CI/CD integration in package.json scripts
- Sample tests for each layer demonstrating patterns
- Documentation for writing and running tests

### Out of Scope

- 100% test coverage of existing codebase (will implement samples and critical paths)
- Visual regression testing (screenshots/snapshots)
- Performance/load testing automation
- Security testing automation (SAST/DAST)
- Test parallelization optimization (can be added later)
- Mutation testing

## Impact Assessment

### Benefits

1. **Quality**: Automated detection of bugs and regressions before production
2. **Confidence**: Deploy with certainty that critical paths work correctly
3. **Velocity**: Faster development cycles with immediate feedback
4. **Documentation**: Tests serve as living documentation of system behavior
5. **Refactoring Safety**: Change code confidently with test safety net
6. **Onboarding**: New developers understand system through tests
7. **Debugging**: Failed tests pinpoint exact location of issues

### Risks & Mitigation

| Risk                | Impact             | Mitigation                                        |
| ------------------- | ------------------ | ------------------------------------------------- |
| Slow test execution | Delayed CI/CD      | Use in-memory SQLite, parallelize where possible  |
| Flaky E2E tests     | False positives    | Use Playwright's auto-wait, proper test isolation |
| Maintenance burden  | Dev time overhead  | Focus on critical paths, use test utilities       |
| Learning curve      | Initial slowdown   | Provide patterns, examples, and documentation     |
| Build time increase | Slower deployments | Run tests in parallel, cache dependencies         |

### Breaking Changes

- **Build Script**: `npm run build` will now run tests first (can fail the build)
- **Deployment**: Failed tests will block deployment
- **Environment Variables**: New `NODE_ENV=test` handling required

### Migration Path

1. Install dependencies and configure testing tools
2. Create test utilities and helpers
3. Write sample tests for each layer
4. Update build scripts to include testing
5. Document testing patterns and best practices
6. Gradually increase coverage over time

## Dependencies

### New Package Dependencies

- `jest` (v29+): Core testing framework
- `@testing-library/react`: React component testing
- `@testing-library/jest-dom`: Custom Jest matchers for DOM
- `@testing-library/user-event`: User interaction simulation
- `jest-environment-jsdom`: Browser-like environment for component tests
- `playwright`: End-to-end browser testing
- `@playwright/test`: Playwright test runner
- `better-sqlite3`: In-memory SQLite for test database
- `@babel/preset-env`, `@babel/preset-react`: Jest transpilation
- `babel-jest`: Jest Babel integration

### Configuration Files

- `jest.config.js`: Jest configuration
- `jest.setup.js`: Global test setup
- `playwright.config.js`: Playwright configuration
- `.babelrc` or `babel.config.js`: Transpilation for Jest
- `tests/setup/`: Test utilities and helpers

### Existing System Changes

- `package.json`: Add test scripts and dependencies
- `src/lib/db.js`: Add SQLite adapter for testing
- Build/deploy scripts: Integrate test execution

## Timeline Estimate

- **Setup & Configuration**: 2-3 hours
- **Test Utilities & Helpers**: 3-4 hours
- **Sample Tests (all layers)**: 4-6 hours
- **CI/CD Integration**: 1-2 hours
- **Documentation**: 2-3 hours
- **Total**: ~12-18 hours

## Success Criteria

1. ✅ All testing dependencies installed and configured
2. ✅ Jest runs successfully with coverage reporting
3. ✅ Playwright runs E2E tests in headless mode
4. ✅ In-memory SQLite database works for integration tests
5. ✅ Sample tests written for unit, integration, and E2E layers
6. ✅ Coverage reports show 80%+ for tested modules
7. ✅ `npm run build` includes test execution
8. ✅ `npm test` runs all tests successfully
9. ✅ Documentation explains how to write and run tests
10. ✅ CI/CD blocks deployment on test failures

## Alternatives Considered

### Vitest Instead of Jest

**Pros**: Faster, native ESM support, Vite ecosystem integration  
**Cons**: Smaller ecosystem, less mature, fewer community resources  
**Decision**: Use Jest as requested by user

### Real MySQL for Tests

**Pros**: Tests match production exactly  
**Cons**: Slow, requires Docker/external service, complex cleanup  
**Decision**: Use SQLite for speed and simplicity

### No E2E Testing

**Pros**: Simpler, faster tests  
**Cons**: Critical user flows not validated  
**Decision**: Include Playwright for complete coverage

## Related Specifications

- New capability: `testing-infrastructure` (ADDED)
- Related to: `authentication`, `project-management`, `task-management` (will add test coverage)

## Approval Checklist

- [ ] Technical approach reviewed and approved
- [ ] Coverage targets agreed upon (80%)
- [ ] Breaking changes (build script) accepted
- [ ] Timeline and effort estimate approved
- [ ] Ready to begin implementation
