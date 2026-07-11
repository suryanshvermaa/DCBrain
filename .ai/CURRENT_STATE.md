# Current State

- **Current Planning Stage:** Master scope and architecture defined. Implementation Phase 1 in progress.
- **Latest Decisions:** Neo4j selected for Knowledge Graph and Failure Propagation. 14-agent ensemble, Simulation Engine, MinIO object storage confirmed in stack.
- **Open Questions:** None blocking. (Graph DB vendor question resolved — see [DECISIONS.md](./DECISIONS.md) ADR-010 and [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) ISSUE-004.)
- **Immediate Next Task:** Task 007 — Compliance Engine. See [NEXT_CHAT.md](./NEXT_CHAT.md) and [tasks/007-compliance-checker/](./tasks/007-compliance-checker/).
- **Phase:** Phase 1 & 2 completed. Sprint 1 and Sprint 2 tasks (001-006) are fully completed.
- **Status:** Document processing, hybrid RAG search, and Chat Interface with PDF export and suggested questions are successfully implemented.
- **Route Contract:** The canonical backend API prefix is `/api/v1`; auth routes are `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, and `/api/v1/auth/me`. Frontend API clients must use the same prefix.
- **Auth Rate Limiting:** Disabled in `APP_ENV=development` so local registration/login loops do not lock out the developer browser. Kept enabled outside development.
- **Document Upload:** Backend now exposes project-scoped document upload/list/detail/download-url/delete endpoints under `/api/v1/projects/:id/documents`. Uploads validate size/count and file content, store private objects in MinIO with UUID object keys, persist metadata/status `QUEUED` in PostgreSQL, and soft-delete records without exposing direct public object URLs.
- **Project Creation UI:** The `/documents` page includes a New project modal wired to `POST /api/v1/projects`, so users with `create_projects` permission can create the first project before uploading documents.
- **Docker Frontend Runtime:** `docker-compose.yml` sets frontend `HOSTNAME=0.0.0.0` and `PORT=3000` so Next standalone binds correctly inside Docker.
- **Chat & RAG:** LangGraph powers an autonomous ReAct AI agent. RAG pipeline uses ChromaDB and BAAI/bge-small-en-v1.5 embeddings for semantic retrieval. PDF export works properly with markdown cleaning.
- **Database Migration Status:** Local Docker Postgres has all Task 003-006 migrations applied, including `ChatSession` and `ChatMessage` models with JSON `metadata` for follow-up questions.
