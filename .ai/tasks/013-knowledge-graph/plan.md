# Task 013: Knowledge Graph & Entity Extraction — Implementation Plan

## Execution Order

### Step 1: Neo4j Schema Design (60 min)
1. Finalize node labels and relationship types.
2. Create constraints and indexes (unique equipment tags, document numbers).
3. Document schema in DATABASE.md.

### Step 2: Entity Extraction (90 min)
1. Extend Document Processing pipeline with entity extraction prompt.
2. Extract equipment, vendors, standards, activities, document references.
3. Normalize and deduplicate extracted entities.

### Step 3: Relationship Extraction (90 min)
1. Implement relationship extraction prompt.
2. Map relationships: `MENTIONS`, `REFERENCES`, `SUPPLIES`, `DEPENDS_ON`, `GOVERNS`.
3. Write idempotent merge queries to Neo4j.

### Step 4: Graph API (90 min)
1. Implement dependency graph endpoint.
2. Implement failure-propagation subgraph endpoint.
3. Add depth filtering (up to 5 hops).

### Step 5: Graph Viewer UI (120 min)
1. Integrate React Flow or Cytoscape.
2. Implement pan, zoom, selection, and detail panel.
3. Add entity-type filters.

### Step 6: Tests & Docs (90 min)
1. Integration tests for Neo4j writes and reads.
2. AI pipeline tests for extraction accuracy.
3. Update ARCHITECTURE.md, DATABASE.md, AI_PIPELINES.md, AGENTS.md.

## Validation

- Upload two documents mentioning the same UPS and verify a shared equipment node.
- Query dependency graph and confirm correct hop depth.
- Verify re-processing does not duplicate nodes.
