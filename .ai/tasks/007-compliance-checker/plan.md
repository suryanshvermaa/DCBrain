# Task 007: Compliance Checker — Implementation Plan

## Execution Order

### Step 1: Compliance Data Model (30 min)
1. Create migration for `compliance_checks` table.
2. Create Prisma model and Zod schemas.

### Step 2: Requirement Extraction (120 min)
1. Create `src/modules/compliance/service.ts`.
2. Use RAG retrieval to extract compliance-relevant clauses from specification documents.
3. Parse specification text to identify referenced standards and clause numbers.
4. Create a mapping between specification requirements and standard codes.

### Step 3: Compliance Analysis (120 min)
1. Design LLM prompt for compliance comparison.
2. For each requirement: retrieve relevant standard clause → compare specification clause → determine compliance status.
3. Extract evidence (exact quotes from both specification and standard).
4. Assign severity based on deviation type.
5. Handle hallucination mitigation: require exact quotes, confidence scoring.

### Step 4: Report Generation (60 min)
1. Aggregate individual findings into a compliance report.
2. Calculate overall compliance percentage.
3. Group findings by standard code.
4. Generate PDF/Markdown export.

### Step 5: API & Frontend (90 min)
1. Create `src/modules/compliance/routes.ts` router.
2. Create compliance check runner (async via BullMQ).
3. Create frontend compliance page components.
4. Create findings table with expand/collapse.

## Validation
- Run compliance check on an electrical specification → findings reference ASHRAE, NFPA, and TIA-942 clauses.
- Each finding includes an exact quote from the source document.
- Compliance percentage reflects actual pass/fail ratio.
- Critical findings are clearly highlighted.
