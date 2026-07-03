# Task 012: RFI Intelligence — Implementation Plan

## Execution Order

### Step 1: Schema & Models (60 min)
1. Define `rfis` and `rfi_documents` Prisma models.
2. Create RFI status enum: open, in-review, answered, closed, void.
3. Run and verify migrations.

### Step 2: RFI CRUD (90 min)
1. Implement `GET/POST/PUT` endpoints for RFIs.
2. Enforce project-level isolation and RBAC.
3. Build RFI list/detail pages.

### Step 3: Suggested Answers (90 min)
1. Integrate RAG pipeline to retrieve context for an RFI question.
2. Build `POST /rfis/{id}/suggest-answer` endpoint.
3. Require human approval before suggested answer becomes official.

### Step 4: Overdue & Analytics (60 min)
1. Implement overdue detection (respect business days/timezone).
2. Build analytics endpoint with ageing buckets.
3. Add overdue alerts to dashboard.

### Step 5: UI Polish (60 min)
1. Add status/due-date filters.
2. Build suggested-answer approval workflow.
3. Add RFI activity to timeline.

### Step 6: Tests & Docs (60 min)
1. Unit tests for status transitions and ageing.
2. Integration tests for CRUD and suggestions.
3. Update FEATURES.md, AGENTS.md, API.md, DATABASE.md.

## Validation

- Create an RFI, link it to a document, and verify suggested answer cites sources.
- Verify overdue RFIs trigger dashboard notifications.
- Confirm analytics buckets match test data.
