# Task 005: RAG Search

## Overview
- **ID:** 005
- **Priority:** P0 (Critical)
- **Estimate:** 8 hours
- **Sprint:** 2
- **Dependencies:** 004 (Document Processing)
- **Status:** Not Started

## Objective

Implement the hybrid search system combining semantic vector search (ChromaDB) with keyword search (PostgreSQL pg_tsvector). Fuse results using Reciprocal Rank Fusion and generate AI-powered answers with source citations using Gemini 2.5 Flash.

## Acceptance Criteria

- [ ] Search endpoint (`POST /api/v1/projects/{id}/search`)
- [ ] Semantic search via ChromaDB (embed query → vector similarity)
- [ ] Keyword search via PostgreSQL pg_tsvector (BM25-style ranking)
- [ ] Reciprocal Rank Fusion (RRF) combining both result sets
- [ ] Top-K result retrieval (configurable, default 10)
- [ ] LLM answer generation from retrieved context using Gemini 2.5 Flash
- [ ] Source citations with document name, page number, relevance score
- [ ] Confidence score on generated answers
- [ ] Search filters: category, date range, specific documents
- [ ] Search history saved per user
- [ ] Response caching in Redis (1 hour TTL)
- [ ] Search response time under 5 seconds (P95)
- [ ] Frontend search page with query input and results display
- [ ] AI answer card with source citation cards below
- [ ] Search history sidebar

## Reference Documents
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — RAG search data flow
- [API.md](../../API.md) — Search endpoint specification
- [DECISIONS.md](../../DECISIONS.md) — ADR-007 Hybrid Search decision
- [TECH_STACK.md](../../TECH_STACK.md) — LangChain and Gemini configuration
