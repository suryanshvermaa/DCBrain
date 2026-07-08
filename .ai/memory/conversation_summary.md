# Conversation Summaries

This file captures key information from development sessions that would otherwise be lost when chat history is unavailable.

---

## Format

Each entry records:
- **Session Date:** When the conversation happened
- **AI Model:** Which model was used
- **Topic:** What was discussed
- **Key Decisions:** Decisions made during the session
- **Key Outputs:** What was produced
- **Unresolved Items:** Anything left open

---

## Session Log

### Session 004 — 2026-07-08

- **AI Model:** Codex
- **Topic:** Task 003 — Document Upload implementation
- **Key Decisions:**
  - Kept Prisma record IDs as existing `cuid()` values, while MinIO object keys use project-scoped UUID paths.
  - Added `DocumentStatus.QUEUED`, document `category`, `deletedAt`, and `document_versions` for upload metadata/version tracking.
  - Implemented soft delete as metadata deletion only; MinIO objects remain private and inaccessible through API after deletion.
  - Validates every file in a batch before storing any object to reduce partial upload risk.
- **Key Outputs:**
  - Backend project routes and document routes under `/api/v1/projects`.
  - Multipart upload with file count/size/content validation, MinIO storage, presigned URL endpoint, list/detail/delete endpoints, audit logging.
  - Frontend `/documents` page with project selector, drag-and-drop upload modal, progress indicator, filters, document table, detail panel, download, and delete.
  - Follow-up: added a New project modal on `/documents` wired to `POST /api/v1/projects` for users with `create_projects` permission.
  - Follow-up: added first-user bootstrap RBAC so a fresh DB's first registered user becomes `PROJECT_MANAGER`; existing local users were promoted to `PROJECT_MANAGER`.
  - Prisma migration `20260708090000_document_upload`.
  - Verification passed: backend Prisma generate/build/tests, frontend type-check/tests/build. Follow-up project modal also passed frontend type-check/tests/build. First-user bootstrap passed backend build/tests and Docker backend restart.
- **Unresolved Items:**
  - Task 004 should add BullMQ document processing, text extraction, chunking, embeddings, ChromaDB writes, and status transitions from `QUEUED`.
  - Dedicated document upload integration tests should be added when the processing pipeline test fixtures are introduced.

### Session 001 — 2026-06-30

- **AI Model:** Claude (Antigravity IDE)
- **Topic:** Project initialization and memory system creation
- **Key Decisions:**
  - Adopted modular monolith architecture for hackathon phase
  - Selected Next.js 14 (App Router) for frontend, Express.js + TypeScript for backend
  - Chose PostgreSQL + ChromaDB + Redis + MinIO + Neo4j as data layer
  - Gemini 2.5 Flash for LLM, BAAI/bge-m3 for embeddings
  - Hybrid search (semantic + keyword) with Reciprocal Rank Fusion
  - BullMQ + Redis for async task processing
  - Redux Toolkit for client state
- **Key Outputs:**
  - Complete `.ai/` memory system with 35 documentation files
  - Database schema with PostgreSQL, ChromaDB, and Neo4j
  - REST API specification with all endpoints
  - 18 task folders with task definitions and implementation plans
  - Reusable AI prompts for development activities
  - 6 document templates
  - Machine-readable state files (JSON)
  - 14-agent AI ensemble specification with full I/O/dependencies/prompt summaries
- **Unresolved Items:**
  - No code written yet — Task 001 (Project Setup) is next
  - Graph DB vendor decision resolved to Neo4j 5.x
  - Task backlog expanded to 18 tasks to cover full documented scope
  - Gemini API key needs to be provisioned
  - Cloud hosting provider (AWS vs Azure) not finalized for production

---

### Session 003 — 2026-07-05

- **AI Model:** GPT-5.4 mini
- **Topic:** Task 002 — Authentication implementation and state sync
- **Key Decisions:**
  - Added `/api/v1/auth` backend routes with JWT access tokens in memory and HttpOnly refresh cookies.
  - Implemented refresh-token rotation with blacklist support and Redis-backed auth rate limiting with in-memory fallback for tests.
  - Kept frontend access tokens in Redux memory only and wrapped the dashboard in a protected route.
  - Updated the repository state so Task 003 is now the active task.
- **Key Outputs:**
  - Backend auth module, Prisma `audit_log` support, and auth tests.
  - Frontend login/register pages, auth slice, and protected dashboard wrapper.
  - Updated `.ai/` docs, state, and next-session instructions.
- **Unresolved Items:**
  - Task 003 (Document Upload) is next.

### Session 002 — 2026-07-04

- **AI Model:** Kimchi
- **Topic:** Complete Task 001 — Project Setup
- **Key Decisions:**
  - Switched backend TypeScript output from `NodeNext` to `CommonJS` + `node` module resolution so path aliases are resolved by `tsc` and the production build runs without external path rewriting.
  - Added Swagger/OpenAPI docs endpoint at `/docs` (served by `swagger-ui-express`) and `/openapi.json`.
  - Switched PostgreSQL Docker image to `pgvector/pgvector:pg16` and enabled the `vector` extension in `prisma/init.sql` to support `DocumentChunk.embedding`.
  - Committed the initial Prisma migration so fresh clones can run `prisma migrate deploy`.
  - Updated Tailwind v4 theme to include a full primary color scale (`primary-50` through `primary-950`).
  - Added `JWT_*` environment variables to the `backend` and `worker` Docker Compose service definitions.
  - Added backend Jest smoke tests and a frontend Vitest smoke test.
- **Key Outputs:**
  - Working Docker Compose environment with 8 services.
  - Backend lint, type-check, and tests pass.
  - Frontend lint, type-check, and tests pass.
  - `/health`, `/docs`, `/openapi.json`, and frontend page verified end-to-end.
  - Initial Prisma migration generated and applied.
  - State files updated: Task 001 completed, Task 002 active.
- **Unresolved Items:**
  - Task 002 — Authentication is the next immediate task.
  - Production Docker image tags should be pinned before deployment (currently `minio/minio:latest`).

---

*Add new session summaries above this line, keeping the most recent at the top.*
