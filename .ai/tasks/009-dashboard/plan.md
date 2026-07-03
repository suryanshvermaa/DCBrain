# Task 009: Dashboard — Implementation Plan

## Execution Order

### Step 1: Dashboard Service (90 min)
1. Create `src/modules/dashboard/service.ts`.
2. Aggregate document statistics from document repository.
3. Aggregate compliance metrics from compliance repository.
4. Aggregate schedule risk indicators from schedule repository.
5. Aggregate procurement status from procurement repository.
6. Calculate composite project health score.
7. Fetch recent activity from audit log.
8. Cache dashboard data in Redis (5-minute TTL).

### Step 2: Dashboard API (45 min)
1. Create `src/modules/dashboard/routes.ts` router.
2. Create dashboard overview endpoint.
3. Create individual widget endpoints.
4. Add WebSocket endpoint for real-time updates.

### Step 3: Frontend Dashboard (180 min)
1. Create `src/components/dashboard/DashboardGrid.tsx` (responsive grid layout).
2. Create `src/components/dashboard/HealthScoreGauge.tsx` (circular gauge).
3. Create `src/components/common/StatCard.tsx` (metric + trend).
4. Create `src/components/dashboard/ComplianceSummaryBar.tsx`.
5. Create `src/components/dashboard/ScheduleRiskHeatMap.tsx`.
6. Create `src/components/dashboard/ActivityFeed.tsx`.
7. Create `src/components/dashboard/ProcurementPipeline.tsx`.
8. Create `src/app/projects/[id]/dashboard/page.tsx`.
9. Create `src/lib/api/dashboard.ts` and `src/hooks/useDashboard.ts`.
10. Wire up WebSocket for real-time updates.

## Validation
- Dashboard loads under 2 seconds.
- Health score reflects actual project metrics.
- Stat cards show correct counts.
- Recent activity shows latest actions.
- Dashboard updates when new document is uploaded (WebSocket).
