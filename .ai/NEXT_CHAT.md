# Next Chat Session: Task 014 — AI Agent Framework

## 1. Current State

- **Just Completed:** Task 013 (Knowledge Graph & Entity Extraction)
  - Configured Neo4j database constraints (unique IDs and Names) in `backend/src/server.ts`.
  - Updated the Document Processing Pipeline (`backend/src/modules/documents/processing/entityExtractor.ts`) to extract relationship structures and write them to Neo4j.
  - Implemented the Knowledge Graph backend API at `/api/v1/projects/:id/graph` to query for global dependencies, failure propagation, and entity listings.
  - Added full test coverage for the Graph API using Neo4j's test suite pattern.
  - Installed `@xyflow/react` and built the Frontend Knowledge Graph UI (`/graph`) featuring a React Flow canvas with dependency layers and failure trace mode.
  - Updated `DATABASE.md`, `ARCHITECTURE.md`, and `AI_PIPELINES.md` to reflect the Graph DB integration.
- **Repository Health:** Backend tests are passing. Prisma client matches the latest migrations (including Schedule imports).

## 2. Deferred Items (non-non-blocking)

- Suggesting realistic alternative vendors in Procurement (Task 011) remains mocked pending deeper graph embeddings.
- Graph UI auto-layout (e.g. ElkJS or Dagre) is not yet implemented; nodes start with simple randomized/initial placement.

## 3. Next Step

- **Target Task:** Task 014 — AI Agent Framework
- **Goal:** Set up the multi-agent orchestration layer using LangGraph. This includes the Supervisor Agent and delegating sub-agents (Document Agent, Schedule Risk Agent, etc.).
- **Dependencies:** Task 013 (Completed).
- **Priority:** P1 — Sprint 5

## 4. Preparation Instructions for AI

1. **Initialize Context:** Read the documentation in `TASKS.md` or `.ai/tasks/014-ai-agent-framework/task.md` to understand the agent workflow.
2. **Key Reference Files:**
   - `.ai/tasks/014-ai-agent-framework/task.md`
   - `.ai/AGENTS.md` (Agent system prompts and roles)
   - `.ai/AI_PIPELINES.md`
3. **Architecture to Follow:** Build on top of LangGraph. Use Gemini 2.5 Flash for agent reasoning and tool usage. Ensure the Supervisor correctly coordinates tasks via Redis/BullMQ if background persistence is needed.

## 5. Files to Read First

- `.ai/NEXT_CHAT.md` (this file)
- `.ai/CURRENT_STATE.md`
- `.ai/tasks/014-ai-agent-framework/task.md`
- `.ai/AGENTS.md`

## 6. Warnings & Known Issues

- Do not change Prisma schema without confirming the effect on previous sprints. 
- Ensure `GEMINI_API_KEY` is present in the `.env` during testing.
