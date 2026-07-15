# Implementation Plan for Task 016 - Simulation Engine

## 1. Database Schema
- [x] Add `Simulation` model to `backend/prisma/schema.prisma` with fields: id, name, description, targetActivityId, delayDays, assumptions, status, impacts, mitigationPlans, costImpact, timeImpactDays, error, projectId, createdById.
- [x] Add `SimulationStatus` enum.
- [x] Add relations on `Project` and `User`.
- [x] Run `npx prisma migrate dev --name add_simulations`.

## 2. Backend Logic
- [x] Create `backend/src/modules/simulations/schemas.ts` for Zod validations.
- [x] Create `backend/src/modules/simulations/service.ts`:
  - `createAndRunSimulation`: Fetch target activity, use `graphService.getFailurePropagation` for cascade impact, estimate cost, persist to DB.
  - `generateMitigationPlan`: Read simulation, format prompt, invoke `runAgentService` for MitigationPlannerAgent, persist results.
- [x] Create `backend/src/modules/simulations/routes.ts` providing standard endpoints.
- [x] Mount routes in `backend/src/routes/index.ts`.
- [x] Update `backend/src/modules/agents/subagents.ts` so `MitigationPlannerAgent` receives `simulationData` and formulates specific mitigation strategies.
- [x] Add integration tests in `routes.test.ts`.

## 3. Frontend UI
- [x] Add `frontend/src/lib/api/simulations.ts` client.
- [x] Create `frontend/src/app/simulations/page.tsx` for listing simulations.
- [x] Create `frontend/src/app/simulations/new/page.tsx` for creating new delay scenarios.
- [x] Create `frontend/src/app/simulations/[id]/page.tsx` for detail view showing failure propagation chain and AI mitigation plans.
