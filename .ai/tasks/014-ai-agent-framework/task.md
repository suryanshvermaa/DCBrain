# Task 014: AI Agent Framework & Supervisor

## Overview
- **ID:** 014
- **Priority:** P0 (Critical)
- **Estimate:** 12 hours
- **Sprint:** 5
- **Dependencies:** 004 (Document Processing), 005 (RAG Search), 006 (Chat Interface), 013 (Knowledge Graph)
- **Status:** Not Started

## Objective

Build the Agent Framework and Supervisor orchestration layer that enables the 14 specialized AI agents to run on schedules or events, dispatch sub-tasks to each other, log runs, and surface findings as notifications. This is the core of DCBrain's autonomous intelligence.

## Acceptance Criteria

- [ ] Agent service module with base `Agent` class/interface (`run(input, ctx) → output`)
- [ ] Supervisor Agent with intent classification and routing to sub-agents
- [ ] Implement P0 agents: Supervisor, Document, Knowledge (Chat), Compliance, Schedule Risk, Procurement, Project Health, Data Validation
- [ ] Implement P1/P2 agents: Commissioning, Risk Analysis, Executive Copilot, Reporting, Recommendation, Mitigation Planner
- [ ] Agent run endpoint (`POST /api/v1/projects/{id}/agents/{type}/run`)
- [ ] Agent list endpoint (`GET /api/v1/projects/{id}/agents`)
- [ ] Agent schedules: on-event, daily, weekly
- [ ] `agent_runs` table with status, input, output, duration, cost estimate
- [ ] Agent findings surfaced as in-app notifications
- [ ] Agent run history UI with detail view
- [ ] Manual trigger + auto-run on document upload / schedule import / procurement import
- [ ] LangGraph.js state-machine wiring for multi-step agent flows
- [ ] Integration tests for Supervisor routing and agent execution

## Required APIs

- `GET /api/v1/projects/{id}/agents`
- `POST /api/v1/projects/{id}/agents/{type}/run`
- `GET /api/v1/projects/{id}/agents/runs`
- `GET /api/v1/projects/{id}/agents/runs/{runId}`

## Required Database Changes

- Create `agent_runs` table
- Create `agent_schedules` table
- Create `notifications` table (or reuse Task 017 table)

## Required Tests

- Unit tests for Supervisor intent classifier
- Integration tests for each agent's `run()` contract
- AI pipeline tests for end-to-end agent flows
- Regression tests for agent outputs

## Required Documentation

- Update [AGENTS.md](../../AGENTS.md) with implementation status per agent
- Update [AI_PIPELINES.md](../../AI_PIPELINES.md) Supervisor orchestration diagram
- Update [API.md](../../API.md) with agent endpoints
- Update [DATABASE.md](../../DATABASE.md) with `agent_runs` schema

## Required Mermaid Diagram Updates

- Update Supervisor Orchestration diagram in [AI_PIPELINES.md](../../AI_PIPELINES.md)
- Update Agent Flow diagram if present

## Technical Details

- Base `Agent` class: `abstract run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput>`
- Supervisor uses Gemini 2.5 Flash JSON mode to emit routing plan
- Each agent is a LangGraph.js node; the graph supports sequential and parallel delegation
- Agent outputs must include `confidence`, `sources`, and `findings`
- Cost/usage tracking per run (token counts where available)

## Reference Documents

- [AGENTS.md](../../AGENTS.md) — Full agent specifications
- [AI_PIPELINES.md](../../AI_PIPELINES.md) — Supervisor and pipeline diagrams
- [TECH_STACK.md](../../TECH_STACK.md) — LangGraph.js, Gemini 2.5 Flash
- [DATABASE.md](../../DATABASE.md) — Agent runs schema
