# Architecture History

This file tracks the evolution of architectural decisions over time. When the architecture changes, the previous state and reasoning for the change are recorded here.

---

## Current Architecture

**Version:** 1.0 (Initial Design)
**Date:** 2026-06-30
**Status:** Active

The current architecture is a modular monolith with clear domain boundaries. See [ARCHITECTURE.md](../ARCHITECTURE.md) for the complete design.

### Architecture Summary

- **Frontend:** Next.js 15 App Router, React 19, TypeScript, TailwindCSS 4, shadcn/ui, Redux Toolkit
- **Backend:** Express.js (Node.js 20+) with modular service architecture
- **Data Layer:** PostgreSQL 16 (primary), ChromaDB (vectors), Redis (cache/broker), MinIO (object storage), Neo4j 5.x (graph)
- **Processing:** BullMQ workers for async document processing
- **AI:** Gemini 2.5 Flash + BAAI/bge-m3 via LangChain / LangGraph
- **Search:** Hybrid (semantic via ChromaDB + keyword via pg_tsvector) with RRF

### Design Rationale
This architecture was chosen to balance hackathon speed with production viability. Each module (auth, documents, search, chat, compliance, schedule, procurement, agents) has its own service layer but shares a deployment unit. Modules are designed for eventual extraction into microservices.

---

## Architecture Timeline

| Version | Date | Change | Reason |
|---------|------|--------|--------|
| 1.0 | 2026-06-30 | Initial architecture designed | Project start |
| 1.1 | 2026-07-01 | Added MinIO, Neo4j, and expanded task scope | Documentation sync; Graph DB decision resolved |
| 1.2 | 2026-07-04 | Project setup implementation | Switched backend TS output to CommonJS for reliable path-alias resolution; added Swagger/OpenAPI docs; aligned stack to Next.js 15 / React 19 / TailwindCSS 4 installed versions |
| 1.3 | 2026-07-05 | Authentication implementation | Added JWT auth module, RBAC middleware, refresh-token rotation, Redis-backed auth rate limiting, audit-log persistence, and frontend protected auth pages |

---

## Planned Architecture Changes

| Change | Target Date | Driver |
|--------|------------|--------|
| ChromaDB → Pinecone/Weaviate (optional) | Phase 3 | Scale beyond 1M embeddings |
| Monolith → Microservices | Phase 3 | Independent scaling per module |
| HS256 → RS256 JWT | Phase 2 | Production security with key rotation |
| Add event bus (Redis Streams) | Phase 3 | Decouple module communication |

---

## How to Update This File

When making an architectural change:

1. Document the change under a new version heading
2. Explain WHY the change was made (not just what changed)
3. Reference the ADR in [DECISIONS.md](../DECISIONS.md)
4. Update the Architecture Timeline table
5. Update [ARCHITECTURE.md](../ARCHITECTURE.md) with the new design
