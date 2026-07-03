# Task 008: Schedule Risk — Implementation Plan

## Execution Order

### Step 1: Data Model (30 min)
1. Create migration for `schedule_activities` table.
2. Create Prisma model and Zod schemas.

### Step 2: P6 XML Parser (120 min)
1. Create `src/modules/schedule/service.ts`.
2. Implement P6 XML parser (handle common export formats).
3. Extract: activity ID, name, WBS, dates (planned/actual), duration, float, dependencies.
4. Validate imported data and handle missing fields.
5. Support re-import (replace previous schedule version).

### Step 3: Risk Analysis (120 min)
1. Calculate critical path from dependency graph.
2. Compute risk score per activity:
   - Float consumption rate (high consumption = higher risk)
   - Predecessor completion status
   - Resource loading conflicts
   - Open RFI dependency count
   - Procurement lead time margin
3. Calculate schedule health: SPI, predicted completion date.
4. Generate mitigation recommendations using LLM.

### Step 4: API & Frontend (90 min)
1. Create `src/modules/schedule/routes.ts` router.
2. Create schedule import, activity list, risk analysis endpoints.
3. Create frontend schedule page with P6 import UI.
4. Create risk heat map visualization (Recharts).
5. Create activity detail panel with risk factors.

## Validation
- Import a P6 XML file → activities parsed and stored correctly.
- Critical path activities identified → verified against P6 output.
- High-risk activities have risk scores > 70.
- Risk heat map displays correct color coding.
- Mitigation recommendations are specific and actionable.
