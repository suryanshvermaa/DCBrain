# Task 011: Procurement Intelligence — Implementation Plan

## Execution Order

### Step 1: Schema & Models (90 min)
1. Define `vendors`, `vendor_performance`, and `procurement_items` Prisma models.
2. Create enums for procurement status pipeline.
3. Run and verify migrations.

### Step 2: Import Pipeline (120 min)
1. Build CSV/XLSX parser using `xlsx`.
2. Create `POST /projects/{id}/procurement/import` endpoint.
3. Validate headers, normalize vendor names, store raw file in MinIO.
4. Queue spec-matching job via BullMQ.

### Step 3: Scoring & Alerts (90 min)
1. Implement vendor score calculation (on-time 40%, quality 30%, compliance 30%).
2. Compute lead-time risk per item.
3. Create alert rules for items within configurable days of required-on-site date.

### Step 4: Alternative Suggestions (60 min)
1. Query vendors for same material/equipment category.
2. Use Gemini 2.5 Flash to rank alternatives with rationale.
3. Expose `GET /projects/{id}/procurement/alternatives/{itemId}`.

### Step 5: UI & Dashboard (120 min)
1. Build procurement list page with pipeline filters.
2. Build vendor scorecard page.
3. Add at-risk widget to main dashboard.

### Step 6: Tests & Docs (60 min)
1. Unit tests for scoring and alerts.
2. Integration tests for import and endpoints.
3. Update FEATURES.md, AGENTS.md, API.md, DATABASE.md.

## Validation

- Import a sample procurement CSV and verify items appear with correct status.
- Verify vendor score changes when delivery data updates.
- Confirm at-risk items appear in dashboard within 5 seconds of import.
