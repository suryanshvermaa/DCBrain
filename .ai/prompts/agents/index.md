# Agent Prompt Library

This directory contains the production prompt templates for every AI agent in DCBrain. Each prompt is designed to be rendered by the Agent Framework (Task 014) and invoked via `POST /api/v1/projects/{id}/agents/{type}/run`.

## Prompt Files

| Agent | File | Priority |
|-------|------|----------|
| Supervisor Agent | [supervisor.md](./supervisor.md) | P0 |
| Document Agent | [document.md](./document.md) | P0 |
| Knowledge Agent (Chat) | [knowledge.md](./knowledge.md) | P0 |
| Compliance Agent | [compliance.md](./compliance.md) | P1 |
| Schedule Risk Agent | [schedule_risk.md](./schedule_risk.md) | P1 |
| Procurement Agent | [procurement.md](./procurement.md) | P1 |
| Commissioning Agent | [commissioning.md](./commissioning.md) | P1 |
| Risk Analysis Agent | [risk_analysis.md](./risk_analysis.md) | P2 |
| Executive Copilot Agent | [executive_copilot.md](./executive_copilot.md) | P2 |
| Reporting Agent | [reporting.md](./reporting.md) | P2 |
| Recommendation Agent | [recommendation.md](./recommendation.md) | P2 |
| Mitigation Planner Agent | [mitigation_planner.md](./mitigation_planner.md) | P2 |
| Project Health Agent | [project_health.md](./project_health.md) | P1 |
| Data Validation Agent | [data_validation.md](./data_validation.md) | P1 |

## Common Prompt Rules

- All prompts are system prompts; user/project context is injected at runtime.
- Every agent must produce structured JSON when the `output_format` field requests it.
- Every finding must include `confidence` (0.0–1.0) and `sources` when evidence exists.
- Agents must never invent facts not grounded in the provided context.
- Agents must respond in the same language as the user query when possible.
