# Task 003: Document Upload — Progress

## Status: Completed

## Checklist
- [x] Database migrations created (projects, project_members existed; documents extended; document_versions added)
- [x] Prisma models created
- [x] Document upload service implemented
- [x] File validation (magic bytes/content structure, size)
- [x] File storage with UUID paths
- [x] Document CRUD endpoints created
- [x] Project CRUD endpoints created
- [x] Pagination and filtering implemented
- [x] Frontend FileUpload component created
- [x] Frontend DocumentList page created
- [x] Frontend upload modal created
- [x] API client and hooks created
- [x] Tests passing

## Work Log

- 2026-07-08: Implemented project-scoped document upload/list/detail/download-url/delete backend endpoints.
- 2026-07-08: Added Prisma schema updates and migration for `DocumentStatus.QUEUED`, document category, soft delete, and `document_versions`.
- 2026-07-08: Added MinIO buffer upload support and private UUID object-key storage.
- 2026-07-08: Added frontend `/documents` page with project selector, filters, upload modal, progress indicator, document table, detail panel, download, and delete actions.
- 2026-07-08: Verification passed: `backend npm run prisma:generate`, `backend npm run build`, `backend npm test -- --runInBand`, `frontend npm run type-check`, `frontend npm test`, `frontend npm run build`.
- 2026-07-08: Added a `/documents` New project modal wired to `POST /api/v1/projects`, fixing the no-projects first-use gap for users with project creation permission.
- 2026-07-08: Follow-up verification passed: `frontend npm run type-check`, `frontend npm test`, `frontend npm run build`.
- 2026-07-08: Added first-user bootstrap RBAC so a fresh DB's first registered user becomes `PROJECT_MANAGER`; promoted existing local demo users to `PROJECT_MANAGER`.
- 2026-07-08: Follow-up verification passed: `backend npm run build`, `backend npm test -- --runInBand`, Docker backend/worker rebuild, and `/health` returned healthy.
- 2026-07-08: Split the document upload migration into two migrations so PostgreSQL can commit `DocumentStatus.QUEUED` before using it as the default status. Applied migrations in local Docker with `prisma migrate deploy`; `prisma migrate status` reports schema up to date.
