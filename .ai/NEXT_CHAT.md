# Next Chat Session: Task 009 — Dashboard

## 1. Current State

- **Just Completed:** Task 008 (Schedule Risk Prediction)
  - Added `ScheduleActivity` and `ScheduleImport` Prisma models with `RiskLevel` and `ScheduleImportStatus` enums.
  - Applied migration `20260713065346_add_schedule_activities`.
  - Implemented P6 XML parser (`parser.ts`) using `fast-xml-parser` with recursive node search.
  - Implemented deterministic risk scoring engine (`risk-engine.ts`) — 4-factor algorithm, 0–100 score, critical path detection, health indicators (SPI, float rate, predicted completion date).
  - Implemented Gemini LLM mitigation generator (`mitigation.ts`) with deterministic rule-based fallback.
  - Implemented schedule service (`service.ts`): importSchedule, getScheduleActivities, getScheduleRiskSummary, listScheduleImports.
  - Implemented schedule router (`routes.ts`) with multer multipart upload, registered at `/api/v1/projects/:id/schedule`.
  - Created frontend API client (`schedule.ts`) using `api.postForm`.
  - Created schedule risk page (`app/schedule/page.tsx`) with Recharts scatter heat map, activities table with expandable mitigation rows, health indicator cards, and drag-and-drop import.
  - All 8 test suites pass (21 tests total), including 3 new schedule route tests.
- **Repository Health:** All tests passing. Repository docs synchronized. Docker stack healthy.

## 2. Compliance Tasks (partial, from Task 007)

Task 007 was marked "initial implementation" — the following items remain incomplete:
- AI-powered compliance comparison (current service uses placeholder findings)
- Evidence extraction (exact quotes from documents)
- Severity classification granularity
- PDF export for compliance report
- Findings table component with expandable rows

These are **not blocking** but should be addressed before the hackathon demo if possible.

## 3. Next Step

- **Target Task:** Task 009 — Dashboard
- **Goal:** Build a comprehensive project dashboard with real-time metrics, activity feed, project health indicators, and cross-module KPIs (compliance score, schedule risk, document count, procurement status).
- **Dependencies:** Builds on the completed projects, documents, compliance, and schedule modules.

## 4. Preparation Instructions for AI

1. **Initialize Context:** Read the Task 009 backlog and architecture notes before implementing.
2. **Review Existing Data:** Dashboard should aggregate real data from: ComplianceCheck, ScheduleActivity, Document, and Activity tables.
3. **Frontend Framework:** Use the established Next.js App Router pattern with Recharts for charts.
4. **API:** Add `/api/v1/projects/:id/dashboard/summary` endpoint in the dashboard module.
5. **Files to Read First:**
   - `.ai/NEXT_CHAT.md` (this file)
   - `.ai/CURRENT_STATE.md`
   - `.ai/tasks/009-dashboard/task.md`
   - `backend/src/modules/compliance/service.ts` (for compliance data pattern)
   - `backend/src/modules/schedule/service.ts` (for schedule data pattern)
   - `frontend/src/app/compliance/page.tsx` (for page pattern)

## 5. Warnings & Known Issues

- `current_task.json` points to Task 006 (not updated during Task 007 — update to 009 at start of Task 009).
- The worker process leaks a timer in tests — non-blocking but produces a warning. Existing issue, not introduced by Task 008.
- `fast-xml-parser` and `xml2js` are transitive dependencies — not listed in `package.json`. If Docker image is rebuilt, verify they remain available.
