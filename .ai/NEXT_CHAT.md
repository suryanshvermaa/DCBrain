# Next Chat Session: Hotfixes Applied

## 1. Current Project Status

- **Phase:** Phase 2 — Intelligence & Deployment (COMPLETE) + Hotfixes
- **Sprints Completed:** 1–5 (tasks 001–019)
- **Tasks Completed:** 19 / 19 + Hotfixes for Document Queues, URLs, & Processing
- **Repository Health:** Backend and frontend type-check clean.

## 2. Just Completed — Hotfixes: Processing Permissions, Document Queues & MinIO Public URLs

- **Permissions Fix:** Identified an `EACCES: permission denied` error occurring when the background worker tried to download files from MinIO for processing into `/app`. Modified `worker.ts` to use `os.tmpdir()` (`/tmp`) for temporary file storage instead of `process.cwd()`.
- **Queue Env Fix:** Identified an issue where documents would remain in a 'queued' status when running `dcbrain-backend-test` because `APP_ENV=test` triggered test mocks. Fixed by checking `NODE_ENV` or `JEST_WORKER_ID` instead.
- **Public URL Fix:** Added `MINIO_PUBLIC_URL` to `backend/src/core/config.ts` to allow generating AWS Signature V4 presigned URLs with the correct public-facing domain (e.g. `storage-dcbrain.nebula-hack.tech` in production and `localhost` in development).

## 3. Architecture Summary

- **Style:** Neuro-symbolic modular monolith (Express + Next.js + BullMQ workers)
- **AI:** Gemini 2.5 Flash via LangChain; LangGraph StateGraph in Chat; class-based agent delegation in Agent Framework
- **Data:** PostgreSQL (relational), ChromaDB (vectors), Neo4j (graph), MinIO (files), Redis (cache + queues)
- **Real-time:** Native WebSocket notifications linked to PostgreSQL DB writes and specific background events.

## 4. Active Task

- **None** — Hotfixes completed.

## 5. Remaining Work

No planned tasks remain. Possible next steps:
- Phase 3: Production hardening, real email invite flow, pagination for large member lists
- Audit log entries for member management actions
- Graph UI auto-layout (ElkJS/Dagre) — deferred from earlier sprints

## 6. Warnings & Known Issues

- Run `npx prisma migrate deploy` to deploy all migrations
- Ensure `GEMINI_API_KEY` is set in `.env`
- Graph integration tests fail without Neo4j running locally (environmental, not code defect)
- `@xyflow/react` type declarations missing in type-check environment (runtime OK)

## 7. Files to Read First

1. `.ai/NEXT_CHAT.md` (this file)
2. `.ai/CURRENT_STATE.md`
3. `.ai/state/current_task.json`

## 8. Deferred Items (non-blocking)

- Graph UI auto-layout (ElkJS/Dagre) not implemented
- Procurement alternative vendor suggestions remain mocked
- Full LangGraph unification of Chat and Agent orchestration deferred
- Real email invite flow for new users (currently provisional accounts with random passwords)
- Audit log entries for member management operations
