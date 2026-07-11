# Next Chat Session: Task 006 — Project Chat

## 1. Current State
- **Just Completed:** Task 005 (RAG Search)
  - Implemented the RAG pipeline using ChromaDB semantic search and PostgreSQL pg_tsvector keyword search, combined via Reciprocal Rank Fusion.
  - Implemented Gemini 2.5 Flash answer generation with source citations.
  - Created a frontend `/search` interface with history, filters, and AI answers.
  - Deployed Redis caching to reduce LLM latency and cost.
  - Fixed TypeScript configuration and typings for `Prisma.InputJsonObject`, BullMQ, and array types.
- **Repository Health:** Backend and frontend build cleanly. Schema correctly handles `SearchHistory`.

## 2. Next Step
- **Target Task:** Task 006 (Project Chat)
- **Goal:** Implement persistent conversational AI sessions using `LangGraph` and `Langchain` bounded by RAG tool context.
- **Dependencies:** The chat needs access to the dual retrievers (`semanticSearch`, `keywordSearch`) we just built in the RAG module.

## 3. Preparation Instructions for AI
1. **Initialize Context:** Read `.ai/tasks/006-chat/task.md` (or equivalent backlog file) to define the specific requirements.
2. **Review RAG Tools:** Look at `backend/src/modules/rag/retriever.ts` to see how you can convert those into LangChain tools.
3. **Database:** Ensure the Prisma schema supports a `ChatSession` and `ChatMessage` model.
4. **Draft Plan:** Produce `implementation_plan.md` for Task 006 before editing any source files.
