# Next Chat Session: Task 007 — Compliance Engine

## 1. Current State
- **Just Completed:** Task 006 (Project Chat)
  - Added `ChatSession` and `ChatMessage` models to Prisma schema.
  - Implemented backend API endpoints for chat session and message CRUD.
  - Integrated LangGraph to manage a conversational agent powered by Gemini 2.5 Flash.
  - Provided the agent with RAG tools (semantic and keyword search) for citing project documents.
  - Implemented the frontend `/chat` interface with a sidebar for sessions and a main chat window.
- **Repository Health:** Backend and frontend build cleanly. The project is ready for the next feature.

## 2. Next Step
- **Target Task:** Task 007 (Compliance Engine)
- **Goal:** Implement automated compliance validation against standards like ASHRAE, NFPA, etc., extracting requirements and validating project documents against them.
- **Dependencies:** Relies on the extracted document text (Task 004) and vector search capabilities (Task 005).

## 3. Preparation Instructions for AI
1. **Initialize Context:** Read `.ai/tasks/007-compliance/task.md` (or equivalent backlog file) to define the specific requirements.
2. **Review Agents:** The Compliance Engine likely involves one of the 14 Autonomous AI Agents. Refer to `.ai/AGENTS.md` and `.ai/ARCHITECTURE.md`.
3. **Database:** Ensure the Prisma schema supports `ComplianceCheck` and `Finding` models.
4. **Draft Plan:** Produce `implementation_plan.md` for Task 007 before editing any source files.
