# Next Chat Session: Task 018 — Advanced EPC Intelligence

## 1. Current Project Status

- **Phase:** Phase 2 — Intelligence & Deployment (in progress)
- **Sprints Completed:** 1–5 (tasks 001–017)
- **Tasks Completed:** 17 / 18
- **Repository Health:** Checked type safety and compiled cleanly for newly created notifications, audit, and frontend components.

## 2. Just Completed — Task 017 (Notifications & Audit)

- Defined Prisma models for `NotificationPreference` and upgraded `Notification` with `link` column (applied migration `20260716044606_add_notification_preferences_and_link`).
- Integrated a native WebSocket server inside `websocket.ts` with a multi-tab user connection registry.
- Implemented `auditMiddleware` mapping routes automatically to log actions (logins/logouts, document uploads/deletes, searches, compliance checks, agent runs, schedule/procurement imports) to the `audit_log` table.
- Added administrative REST endpoint `GET /api/v1/admin/audit-log` (restricted to ADMIN role) and project-scoped activity query `GET /api/v1/projects/:id/activity`.
- Developed glassmorphic `NotificationBell` frontend component with WebSocket sync, visual indicator badge, and custom chime audio.
- Developed `/settings` page for user profiles and notification preference checkboxes.
- Developed `/activity` vertical timeline page to browse project activity feeds.
- Developed secure `/admin/audit-log` dashboard page with queries, filters, pagination, and JSON details modal.

## 3. Architecture Summary

- **Style:** Neuro-symbolic modular monolith (Express + Next.js + BullMQ workers)
- **AI:** Gemini 2.5 Flash via LangChain; LangGraph StateGraph in Chat; class-based agent delegation in Agent Framework
- **Data:** PostgreSQL (relational), ChromaDB (vectors), Neo4j (graph), MinIO (files), Redis (cache + queues)
- **Real-time:** Native WebSocket notifications linked to PostgreSQL DB writes and specific background events.

## 4. Active Task

- **None** — Task 017 just completed.

## 5. Recommended Next Task

- **Task 018 — Advanced EPC Intelligence** (`tasks/018-advanced-epc-intelligence/`)
- **Goal:** Implement remaining tracking for Non-Conformance Reports (NCRs), Inspections, Commissioning checklists, and Change Orders to complete the project features.
- **Dependencies:** Task 017 (completed)
- **Priority:** P1 — Sprint 5

## 6. Remaining Work (Sprint 5+)

| Task | Name | Status |
|------|------|--------|
| 018 | Advanced EPC Intelligence | Not Started |

## 7. Warnings & Known Issues

- Run `npx prisma migrate deploy` to deploy all migrations (including the notifications preferences database upgrades)
- Ensure `GEMINI_API_KEY` is set in `.env`
- Graph integration tests fail without Neo4j running locally (environmental, not code defect)

## 8. Files to Read First

1. `.ai/NEXT_CHAT.md` (this file)
2. `.ai/CURRENT_STATE.md`
3. `.ai/tasks/018-advanced-epc-intelligence/task.md`

## 9. Deferred Items (non-blocking)

- Graph UI auto-layout (ElkJS/Dagre) not implemented
- Procurement alternative vendor suggestions remain mocked
- Full LangGraph unification of Chat and Agent orchestration deferred
