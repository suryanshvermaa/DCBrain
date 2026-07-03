# Task 005: RAG Search — Implementation Plan

## Execution Order

### Step 1: Retrieval Components (90 min)
1. Create `src/modules/rag/retriever.ts` — ChromaDB semantic retriever (embed query, search, return top-K).
2. Create keyword search function using PostgreSQL `pg_tsvector` on `chunks` table (BM25-style ranking).
3. Create `src/modules/rag/fusion.ts` — Reciprocal Rank Fusion algorithm.
4. Implement deduplication of chunks appearing in both result sets.

### Step 2: Answer Generation (60 min)
1. Create `src/modules/rag/generator.ts` — LLM answer synthesis with Gemini 2.5 Flash.
2. Design system prompt for Data Centre EPC domain.
3. Implement context assembly (format retrieved chunks into LLM context).
4. Parse LLM output to extract answer, confidence, and source references.
5. Handle edge cases: no relevant results, low confidence, context window overflow.

### Step 3: RAG Pipeline (60 min)
1. Create `src/modules/rag/pipeline.ts` — orchestrates retrieval → fusion → generation.
2. Implement search filters (category, date range, document IDs).
3. Add Redis caching for identical queries (1-hour TTL).
4. Implement search history persistence.

### Step 4: Search API (45 min)
1. Create `src/modules/search/routes.ts` router.
2. Create Zod schemas for search request/response.
3. Add search history and suggestions endpoints.
4. Implement response time tracking.

### Step 5: Frontend Search UI (90 min)
1. Create `src/app/projects/[id]/search/page.tsx`.
2. Create search input with autocomplete and filter toggles.
3. Create AI answer card with source citations.
4. Create source citation cards with document links.
5. Create search history sidebar.
6. Create `src/lib/api/search.ts` and `src/hooks/useSearch.ts`.

## Validation
- Search "cooling redundancy requirements" → AI answer with relevant spec citations.
- Search "NFPA 75 Section 5.1.3" → exact keyword match appears in results.
- Search with category filter → only matching category documents returned.
- Identical search within 1 hour → served from cache (faster response).
- Search with no matching documents → graceful "no results" response.
