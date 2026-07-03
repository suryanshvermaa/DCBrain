# Task 016: Simulation & Mitigation Planner — Implementation Plan

## Execution Order

### Step 1: Schema (60 min)
1. Define `simulations`, `simulation_impacts`, and `mitigation_plans` Prisma models.
2. Run migrations.

### Step 2: Graph Loading (60 min)
1. Load schedule activities and dependencies from Neo4j.
2. Build in-memory dependency graph for fast traversal.

### Step 3: Propagation Engine (120 min)
1. Implement delay propagation across `DEPENDS_ON` relationships.
2. Compute impacted activities and new predicted completion date.
3. Estimate cost impact using daily activity rates.

### Step 4: What-if & Comparison (60 min)
1. Allow multiple scenarios per project.
2. Implement baseline vs simulated comparison endpoint.

### Step 5: Mitigation Planner (90 min)
1. Integrate Mitigation Planner Agent.
2. Generate 3 ranked mitigation strategies with trade-offs.
3. Persist mitigation plans.

### Step 6: UI (120 min)
1. Build simulation builder form.
2. Build results viewer with impacted activities list.
3. Add before/after Gantt-style timeline.

### Step 7: Tests & Docs (90 min)
1. Unit tests for propagation algorithm.
2. Performance test: simulation returns in <15 seconds.
3. Update FEATURES.md, AGENTS.md, API.md, DATABASE.md, AI_PIPELINES.md.

## Validation

- Run a 4-week chiller delay simulation and verify cascade to commissioning.
- Confirm mitigation plans are actionable and persisted.
- Verify response time under 15 seconds.
