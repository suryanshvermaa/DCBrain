# Task 013: Knowledge Graph & Entity Extraction — Implementation Plan

## Execution Order

### Step 1: Neo4j Schema Design (60 min)
- [x] Finalize node labels and relationship types.
- [x] Create constraints and indexes (unique equipment tags, document numbers).
- [x] Document schema in DATABASE.md.

### Step 2: Entity Extraction (90 min)
- [x] Extend Document Processing pipeline with entity extraction prompt.
- [x] Extract equipment, vendors, standards, activities, document references.
- [x] Normalize and deduplicate extracted entities.

### Step 3: Relationship Extraction (90 min)
- [x] Implement relationship extraction prompt.
- [x] Map relationships: `MENTIONS`, `REFERENCES`, `SUPPLIES`, `DEPENDS_ON`, `GOVERNS`.
- [x] Write idempotent merge queries to Neo4j.

### Step 4: Graph API (90 min)
- [x] Implement dependency graph endpoint.
- [x] Implement failure-propagation subgraph endpoint.
- [x] Add depth filtering (up to 5 hops).

### Step 5: Graph Viewer UI (120 min)
- [x] Integrate React Flow or Cytoscape.
- [x] Implement pan, zoom, selection, and detail panel.
- [x] Add entity-type filters.

### Step 6: Tests & Docs (90 min)
- [x] Integration tests for Neo4j writes and reads.
- [x] AI pipeline tests for extraction accuracy.
- [x] Update ARCHITECTURE.md, DATABASE.md, AI_PIPELINES.md, AGENTS.md.

## Validation

- Upload two documents mentioning the same UPS and verify a shared equipment node.
- Query dependency graph and confirm correct hop depth.
- Verify re-processing does not duplicate nodes.
