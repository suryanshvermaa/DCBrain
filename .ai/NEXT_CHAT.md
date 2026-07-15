# Next Chat Session: Task 016 — Simulation Engine

## 1. Current Project Status

- **Phase:** Phase 2 — Intelligence & Deployment (in progress)
- **Sprints Completed:** 1–4 (tasks 001–013), Sprint 6 (task 010), Sprint 5 Tasks 014–015
- **Tasks Completed:** 15 / 18
- **Repository Health:** Report module tests 13/13 passing. Agent module tests 9/9 passing. Full suite 60 tests (graph tests require Neo4j running locally).

## 2. Just Completed — Task 015 (Reporting Engine)

- Implemented `reports` module at `backend/src/modules/reports/`:
  - Template engine supporting 6 report types (daily, weekly, executive, compliance, risk, procurement)
  - Section aggregators that pull data from all existing modules
  - Gemini AI summaries generated per section
  - PDFKit PDF generation and MinIO storage
  - REST API: `POST /reports/generate`, `GET /reports`, `GET /reports/:reportId`, `GET /reports/:reportId/download`
  - BullMQ `report-generation` worker for async processing
  - Prisma `Report` model with `ReportType`/`ReportStatus` enums (migration `20260715100000_add_reports`)
- Upgraded `ReportingAgent` to call actual report generation
- Frontend `/reports` page with generate dialog, reports table, preview modal, and PDF/Markdown download
- Tests: `routes.test.ts` (13/13 passing)

## 3. Also Completed — Task 014 (AI Agent Framework)

- `BaseAgentImpl` with supervisor intent routing and 14 sub-agents
- REST API at `/agents` and frontend `/agents` page
- BullMQ `agent-execution` queue with auto-triggers

## 4. Architecture Summary

- **Style:** Neuro-symbolic modular monolith (Express + Next.js + BullMQ workers)
- **AI:** Gemini 2.5 Flash via LangChain; LangGraph StateGraph in Chat; class-based agent delegation in Agent Framework
- **Data:** PostgreSQL (relational), ChromaDB (vectors), Neo4j (graph), MinIO (files), Redis (cache + queues)
- **Reporting:** PDFKit for PDF generation, MinIO for storage, BullMQ for async generation

## 5. Active Task

- **None** — Task 015 just completed.

## 6. Recommended Next Task

- **Task 016 — Simulation Engine** (`tasks/016-simulation-engine/`)
- **Goal:** Build the "what-if" scenario engine for testing failure propagation and testing mitigation strategies (e.g. "What happens if Vendor A is delayed by 3 weeks?").
- **Dependencies:** Task 008, 013, 014, 015 (completed)
- **Priority:** P1 — Sprint 5

## 7. Remaining Work (Sprint 5+)

| Task | Name | Status |
|------|------|--------|
| 016 | Simulation Engine | Not Started |
| 017 | Notifications & Audit | Not Started |
| 018 | Advanced EPC Intelligence | Not Started |

## 8. Warnings & Known Issues

- Run `npx prisma migrate deploy` to apply migrations up to `20260715100000_add_reports`
- Ensure `GEMINI_API_KEY` is set in `.env`
- Graph integration tests fail without Neo4j running locally (environmental, not code defect)

## 9. Files to Read First

1. `.ai/NEXT_CHAT.md` (this file)
2. `.ai/CURRENT_STATE.md`
3. `.ai/tasks/016-simulation-engine/task.md`
4. `backend/src/modules/schedule/` (for math logic to integrate with simulation)
5. `backend/src/modules/graph/` (for propagation logic)

## 10. Deferred Items (non-blocking)

- Graph UI auto-layout (ElkJS/Dagre) not implemented
- Procurement alternative vendor suggestions remain mocked
- Full LangGraph unification of Chat and Agent orchestration deferred
