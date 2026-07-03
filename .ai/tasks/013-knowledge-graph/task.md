# Task 013: Knowledge Graph & Entity Extraction

## Overview
- **ID:** 013
- **Priority:** P1 (High)
- **Estimate:** 10 hours
- **Sprint:** 4
- **Dependencies:** 004 (Document Processing)
- **Status:** Not Started

## Objective

Build the Knowledge Graph layer on Neo4j: extract entities (equipment, vendors, standards, activities, documents) and relationships from processed documents, persist them as nodes and edges, and expose graph queries for dependency visualization and downstream simulation.

## Acceptance Criteria

- [ ] Neo4j schema design: node labels (`Document`, `Equipment`, `Vendor`, `Standard`, `ScheduleActivity`, `RFI`, `NCR`, `ProcurementItem`) and relationship types (`REFERENCES`, `SUPPLIES`, `DEPENDS_ON`, `GOVERNS`, `MENTIONS`)
- [ ] Entity extraction step in document processing pipeline (Task 004 enhancement)
- [ ] Relationship extraction between documents, equipment, vendors, and standards
- [ ] Write entities/relationships to Neo4j during document processing
- [ ] Graph query endpoint (`GET /api/v1/projects/{id}/graph/dependencies`)
- [ ] Failure-propagation subgraph endpoint (`GET /api/v1/projects/{id}/graph/failures`)
- [ ] Frontend Knowledge Graph viewer (React Flow or Cytoscape)
- [ ] Graph filtering by entity type and relationship depth (up to 5 hops)
- [ ] Cross-document linking: "documents that mention the same equipment"
- [ ] Duplicate entity reconciliation (fuzzy matching on equipment tags and vendor names)
- [ ] Database migration for any relational entity tables (if not already in Task 004)
- [ ] Integration tests for Neo4j writes and graph queries

## Required APIs

- `GET /api/v1/projects/{id}/graph/dependencies`
- `GET /api/v1/projects/{id}/graph/failures`
- `GET /api/v1/projects/{id}/graph/entities`
- `GET /api/v1/projects/{id}/graph/entities/{entityId}/related`

## Required Database Changes

- Create `entities` and `entity_relationships` tables in PostgreSQL as a mirror/audit layer (optional; Neo4j is source of truth for graph)
- Add entity extraction metadata to `chunks` table

## Required Tests

- Unit tests for entity normalization and deduplication
- Integration tests for Neo4j node/edge creation
- API tests for graph endpoints
- AI pipeline tests for entity extraction accuracy

## Required Documentation

- Update [ARCHITECTURE.md](../../ARCHITECTURE.md) Knowledge Graph diagrams
- Update [DATABASE.md](../../DATABASE.md) with Neo4j schema notes
- Update [AGENTS.md](../../AGENTS.md) Document Agent outputs
- Update [AI_PIPELINES.md](../../AI_PIPELINES.md) with graph indexing details

## Required Mermaid Diagram Updates

- Update Document Processing & Graph Indexing Pipeline in [AI_PIPELINES.md](../../AI_PIPELINES.md)
- Update Architecture graph in [ARCHITECTURE.md](../../ARCHITECTURE.md)

## Technical Details

- Use `neo4j-driver` for Node.js connectivity
- Entity extraction prompt: extract `equipment_tags`, `vendor_names`, `standard_codes`, `activity_ids`, `document_numbers`
- Relationship extraction prompt: identify how entities relate based on sentence context
- Implement idempotent writes so re-processing a document updates rather than duplicates nodes
- Graph viewer supports pan, zoom, node selection, and detail panel

## Reference Documents

- [DECISIONS.md](../../DECISIONS.md) — ADR-010 Graph Database
- [DATABASE.md](../../DATABASE.md) — Graph DB schema
- [TECH_STACK.md](../../TECH_STACK.md) — Neo4j 5.x
- [AGENTS.md](../../AGENTS.md) — Document Agent, Knowledge Agent
- [AI_PIPELINES.md](../../AI_PIPELINES.md) — Graph indexing pipeline
