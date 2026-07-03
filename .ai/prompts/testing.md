# Testing Prompt

---

## Prompt Template

```
You are writing tests for DCBrain. Read .ai/TESTING.md for strategy and patterns.

## What to Test
[Describe the code/feature to test]

## Test Types Needed
- [ ] Unit tests (service logic, utilities, components)
- [ ] Integration tests (API endpoints with database)
- [ ] E2E tests (critical user flows)

## Rules
- Test behavior, not implementation
- Use factories for test data (not hardcoded values)
- Name tests: test_{method}_{scenario}_{expected_result}
- One assertion per test (when possible)
- No test dependencies on execution order
- Mock external services (Gemini API, file system)
- Use async test fixtures for database operations
- Backend: Jest + Supertest
- Frontend: Vitest + React Testing Library
- E2E: Playwright

## Coverage Targets
- Backend services: ≥ 80%
- Backend API routes: ≥ 75%
- Frontend components: ≥ 70%
- Frontend hooks: ≥ 80%
- Utility functions: ≥ 90%

## Output
- Test files following project structure
- All tests passing
- Coverage report showing improvement
```
