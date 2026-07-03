# Task 018: Advanced EPC Intelligence — Implementation Plan

## Execution Order

### Step 1: Schema (90 min)
1. Define `ncrs`, `inspections`, `commissioning_records`, and `change_orders` Prisma models.
2. Create status enums for each module.
3. Run migrations.

### Step 2: NCR Module (90 min)
1. Implement NCR CRUD and import.
2. Link NCRs to documents, RFIs, vendors.
3. Build NCR trend analytics.

### Step 3: Inspection Module (90 min)
1. Implement ITP/inspection record upload and tracking.
2. Detect missing/overdue hold points.
3. Build inspection summary by discipline.

### Step 4: Commissioning Module (120 min)
1. Parse commissioning scripts/procedures.
2. Track test record status.
3. Validate records against scripts using Compliance Agent patterns.
4. Build Commissioning Copilot UI.

### Step 5: Change Orders (60 min)
1. Implement Change Order CRUD and import.
2. Link change orders to affected documents and schedule activities.

### Step 6: Quality Dashboard (60 min)
1. Compute quality score from NCR/inspection/commissioning rates.
2. Add quality widget to main dashboard.

### Step 7: Tests & Docs (90 min)
1. Integration tests for each CRUD module.
2. Update FEATURES.md, AGENTS.md, API.md, DATABASE.md.

## Validation

- Create an NCR and verify it links to a vendor and impacts vendor score.
- Upload a commissioning record and verify pass/fail status.
- Confirm quality score feeds into project health score.
