# Task 014: AI Agent Framework & Supervisor — Implementation Plan

## Execution Order

### Step 1: Base Agent Framework (120 min)
1. Define `Agent` base class/interface with `run(input, ctx)` contract.
2. Build agent registry and factory.
3. Create `agent_runs` and `agent_schedules` Prisma models.

### Step 2: Supervisor (120 min)
1. Implement intent classification using Gemini 2.5 Flash JSON mode.
2. Build routing logic with parallel/sequential dispatch options.
3. Compose multi-agent responses.

### Step 3: P0 Agents (240 min)
1. Implement Document, Knowledge, Compliance, Schedule Risk, Procurement, Project Health, Data Validation agents.
2. Wire each to existing services and databases.
3. Add unit tests for each agent.

### Step 4: P1/P2 Agents (180 min)
1. Implement Commissioning, Risk Analysis, Executive Copilot, Reporting, Recommendation, Mitigation Planner agents.
2. Ensure each produces structured output with confidence and sources.

### Step 5: API & Scheduling (90 min)
1. Implement agent list and run endpoints.
2. Add BullMQ scheduled jobs for daily/weekly agents.
3. Trigger agents on document/schedule/procurement import events.

### Step 6: UI & Notifications (90 min)
1. Build agent run history page.
2. Surface agent findings as notifications.
3. Add manual trigger buttons per agent.

### Step 7: Docs (60 min)
1. Update AGENTS.md with implementation status.
2. Update AI_PIPELINES.md, API.md, DATABASE.md.

## Validation

- Query Supervisor and verify correct sub-agent is invoked.
- Run each P0 agent manually and verify structured output.
- Confirm scheduled agents execute and log results.
