# Next Chat Instructions

> This file tells any AI model exactly what to read and what to do when starting a new session.

## Current Status

**Date:** 2026-07-05
**Phase:** Phase 1 — Foundation
**Active Task:** 003 — Document Upload
**Active Task File:** [tasks/003-document-upload/task.md](./tasks/003-document-upload/task.md)
**Blocker:** None

## Before Writing Any Code, Read These Files

### Mandatory Reading

1. [CURRENT_STATE.md](./CURRENT_STATE.md)
2. [state/current_task.json](./state/current_task.json)
3. [tasks/003-document-upload/](./tasks/003-document-upload/)

### Read For Context

4. [ARCHITECTURE.md](./ARCHITECTURE.md)
5. [DECISIONS.md](./DECISIONS.md)
6. [TECH_STACK.md](./TECH_STACK.md)
7. [CODING_STANDARDS.md](./CODING_STANDARDS.md)
8. [SECURITY.md](./SECURITY.md)
9. [ENVIRONMENT.md](./ENVIRONMENT.md)
10. [API.md](./API.md)
11. [DATABASE.md](./DATABASE.md)
12. [UI_GUIDELINES.md](./UI_GUIDELINES.md)
13. [COMPONENTS.md](./COMPONENTS.md)

## Current Project Status

Authentication is complete and verified. The backend now exposes `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, and `/api/v1/auth/me` with JWT access tokens in memory, HttpOnly refresh cookies, RBAC middleware, refresh-token rotation, and auth rate limiting. The frontend now has `/login`, `/register`, a Redux auth slice, API client integration, and a protected dashboard wrapper.

Prisma was updated to include `audit_log`, and the initial migration now replays cleanly because it also enables `vector`. The backend test env now accepts `APP_ENV=test`.

## Important Decisions

- Auth access tokens are kept in Redux memory only.
- Refresh tokens are issued as HttpOnly cookies and rotated on refresh.
- RBAC is enforced in backend middleware with a permission map derived from `SECURITY.md`.
- Auth rate limiting is Redis-backed with an in-memory fallback for tests.

## Remaining Work

Implement Task 003: document upload, MinIO storage, file validation, document listing, and the frontend upload/list UI.

## Next Recommended Task

Task 003 — Document Upload.

## Warnings

- The auth implementation relies on `APP_ENV=test` being valid in backend config.
- The Prisma initial migration was updated to include the `vector` extension and `audit_log` table so schema replay succeeds.
- Refresh-token blacklist state is stored in Redis when available and falls back to in-memory storage in tests.

## Known Issues

- None blocking.

## Files The Next AI Should Read First

1. [CURRENT_STATE.md](./CURRENT_STATE.md)
2. [state/current_task.json](./state/current_task.json)
3. [tasks/003-document-upload/task.md](./tasks/003-document-upload/task.md)
4. [tasks/003-document-upload/plan.md](./tasks/003-document-upload/plan.md)
5. [SECURITY.md](./SECURITY.md)
6. [API.md](./API.md)
7. [DATABASE.md](./DATABASE.md)
