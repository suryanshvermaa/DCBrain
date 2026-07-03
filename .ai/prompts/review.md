# Code Review Prompt

Use this prompt when asking an AI model to review code.

---

## Prompt Template

```
You are reviewing code for DCBrain, an AI-powered EPC Project Intelligence platform.

## Standards to Review Against
Read these files first:
1. .ai/CODING_STANDARDS.md — Coding standards
2. .ai/SECURITY.md — Security requirements
3. .ai/TESTING.md — Testing expectations
4. .ai/ARCHITECTURE.md — Architecture patterns

## Code to Review
[Paste the code or reference the file paths]

## Review Checklist

### Code Quality
- [ ] Follows naming conventions (PascalCase components and types, camelCase functions and variables)
- [ ] No magic numbers or hardcoded strings
- [ ] No dead code or commented-out blocks
- [ ] Functions are single-responsibility
- [ ] Error handling is explicit (no swallowed exceptions)
- [ ] Type annotations on all exported functions

### Security
- [ ] Input validation on all API endpoints (Zod schemas)
- [ ] No SQL injection vulnerabilities (parameterized queries only)
- [ ] No sensitive data in logs
- [ ] RBAC check on every endpoint
- [ ] File uploads validated by content type

### Architecture
- [ ] Code is in the correct directory per ARCHITECTURE.md
- [ ] Service layer contains business logic, not routes
- [ ] Repository pattern used for database access
- [ ] No circular dependencies

### Testing
- [ ] Critical paths have tests
- [ ] Test names follow convention: test_{method}_{scenario}_{expected}
- [ ] Tests use factories, not hardcoded data
- [ ] No test dependencies on execution order

## Output Format
For each issue found, provide:
1. File and line reference
2. Issue description
3. Severity (Critical / Major / Minor / Suggestion)
4. Recommended fix with code example
```
