# Architectural Decision Records (ADRs)

- **ADR-001:** Modular Monolith over Microservices (simplicity, speed, single deployment unit).
- **ADR-002:** Next.js App Router for frontend (RSC, routing).
- **ADR-003:** PostgreSQL over MongoDB (Relational data, ACID, JSONB, full-text search).
- **ADR-004:** ChromaDB for Vector Storage (Simple setup for hackathon, migrate to Pinecone later).
- **ADR-005:** Gemini 2.5 Flash for LLM Reasoning, BAAI/bge-m3 for Vector Embeddings (Cost, speed, embedding quality).
- **ADR-006:** BullMQ + Redis for background tasks (Scalability, decoupled processing).
- **ADR-007:** Hybrid Search (Semantic + Keyword) over Pure Vector (Better exact match + conceptual match via RRF).
- **ADR-008:** Redux Toolkit for Frontend State (Predictability, slice-based separation).
- **ADR-009:** MinIO for Object Storage (Self-hosted S3 compatibility, scalable document storage).
- **ADR-010:** Graph Database for EPC Intelligence. Vendor: **Neo4j 5.x**. Required for mapping complex equipment, vendor, and task dependencies for Failure Propagation Analysis. Chosen over Memgraph for: (a) more mature Node.js driver (`neo4j-driver`), (b) richer Cypher tooling and LangChain.js `Neo4jGraph` integration, (c) larger community and documentation surface for hackathon velocity, (d) self-hosted Community Edition is free and runs in Docker. Memgraph remains a viable future alternative if write-throughput becomes a bottleneck (see [TECH_STACK.md](./TECH_STACK.md), [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) ISSUE-004 for prior deliberation).
