# Task 007: Compliance Checker — Progress

## Status: Implemented (initial workflow)

## Checklist
- [x] Compliance checks table migration
- [x] Compliance models and schemas
- [x] Basic requirement extraction from project context
- [x] Standard clause mapping (initial standards labels)
- [ ] AI-powered compliance comparison
- [ ] Evidence extraction (exact quotes)
- [ ] Severity classification
- [x] Report generation with percentages
- [ ] PDF export
- [x] Compliance API endpoints
- [x] Frontend compliance page
- [ ] Findings table component
- [x] Tests passing

## Work Log

- Added a new compliance module with service, routes, validation schemas, and persistence.
- Wired project-scoped compliance endpoints into the backend router tree.
- Added a frontend compliance page that triggers a check and displays a summary.
- Verified the backend route and service tests with Jest.
