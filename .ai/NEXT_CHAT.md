# Next Chat Session: Task 013 — Knowledge Graph & Entity Extraction

## 1. Current State

- **Just Completed:** Task 012 (RFI Intelligence)
  - Registered backend `rfisRouter` in `backend/src/routes/index.ts`.
  - Added RFI unresolved and overdue statistics calculation to the `DashboardSummary` response.
  - Implemented `GET /api/v1/projects/:id/members` route to return project member names and roles for form assignees.
  - Created frontend API client at `frontend/src/lib/api/rfis.ts`.
  - Built the main RFI dashboard at `frontend/src/app/rfis/page.tsx` supporting status/overdue filtering, master-detail side-by-side view, AI suggested RAG drafts and RAG citation details, and human response edit-and-approval triggers.
  - Integrated sidebar links, stat cards, and overview widgets for RFIs on the main dashboard home page.
  - Cleaned up compiler errors in the procurement controller.
  - Added full test coverage (unit + integration tests) for the RFI service and controllers, ensuring all backend tests pass.
- **Repository Health:** Backend linter/typecheck and all Jest test suites are passing cleanly.

## 2. Deferred Items (non-blocking)

- Suggesting realistic alternative vendors in Procurement (Task 011) remains mocked pending database load.
- Bulmq worker schedule triggers for checking RFI overdue status (Task 012) is managed as a background task.

## 3. Next Step

- **Target Task:** Task 013 — Knowledge Graph & Entity Extraction
- **Goal:** Build the Knowledge Graph service using Neo4j to map equipment tags, referenced standards clauses, and task dependencies. Perform name entity extraction during document processing.
- **Dependencies:** Task 012 completed.
- **Priority:** P1 — Sprint 4

## 4. Preparation Instructions for AI

1. **Initialize Context:** Read files listed in §5 below before implementing.
2. **Key Reference Files:**
   - `.ai/tasks/013-knowledge-graph/task.md`
   - `.ai/tasks/013-knowledge-graph/plan.md`
   - `.ai/DECISIONS.md` — ADR-010 regarding Neo4j 5.x graph configuration
3. **Architecture to Follow:** Create module-based backend `backend/src/modules/graph/` and Neo4j driver configurations. Ingest entities during the document processing pipeline (Task 004).

## 5. Files to Read First

- `.ai/NEXT_CHAT.md` (this file)
- `.ai/CURRENT_STATE.md`
- `.ai/tasks/013-knowledge-graph/task.md`
- `.ai/tasks/013-knowledge-graph/plan.md`
- `.ai/DECISIONS.md` (ADR-010)

## 6. Warnings & Known Issues

- Ensure the Neo4j container is running locally (configured in `docker-compose.yml`) before running tests that hit the graph database.
- Use `neo4j-driver` for query execution. Keep transaction functions clean and close connections properly.
