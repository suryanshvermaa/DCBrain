# Prompts System

This file is the high-level prompt index. Detailed, production-ready agent prompts live in [`prompts/agents/`](./prompts/agents/); reusable development prompts live in [`prompts/`](./prompts/).

---

## AI Prompts (Gemini 2.5 Flash)

### RAG Answer Generation
```text
You are an expert EPC Data Centre engineer. Answer the user's query based ONLY on the provided context documents. Cite your sources using [DocName - Page].
Context: {context}
Query: {query}
```
See also: [`prompts/agents/knowledge.md`](./prompts/agents/knowledge.md)

### Compliance Validation
```text
Analyze this engineering specification excerpt against the provided standard code.
Standard: {standard}
Excerpt: {excerpt}
Output JSON: { "status": "pass|fail|warning", "finding": "...", "clause_ref": "...", "evidence_quote": "..." }
```
See also: [`prompts/agents/compliance.md`](./prompts/agents/compliance.md)

### Schedule Risk Analysis
```text
Given these schedule activities, identify activities on the critical path that have high resource constraints and low float.
Activities: {activities}
Output JSON: { "high_risk_ids": [...], "reasons": [...], "predicted_delay_days": {...} }
```
See also: [`prompts/agents/schedule_risk.md`](./prompts/agents/schedule_risk.md)

### Supervisor Orchestration
```text
You are the Supervisor Agent. Route the user's query to the most appropriate sub-agent (document, knowledge, compliance, schedule_risk, procurement, commissioning, risk_analysis, executive_copilot, reporting, recommendation, mitigation_planner, project_health, data_validation).
Query: {query}
Output JSON: { "agent_to_invoke": "...", "extracted_parameters": {...}, "reasoning": "...", "requires_composition": false }
```
See also: [`prompts/agents/supervisor.md`](./prompts/agents/supervisor.md)

### Failure Mitigation Planner
```text
The following simulation shows a 4-week delay in Chiller delivery propagating to Commissioning. Suggest three mitigation strategies involving alternative sequencing or expediting procurement.
Simulation Data: {simulation_data}
Output JSON: { "mitigation_plans": [...], "recommended_plan_id": "...", "reasoning": "..." }
```
See also: [`prompts/agents/mitigation_planner.md`](./prompts/agents/mitigation_planner.md)

---

## Agent Prompt Library

All 14 agents have dedicated prompt files in [`prompts/agents/`](./prompts/agents/):

- [`supervisor.md`](./prompts/agents/supervisor.md)
- [`document.md`](./prompts/agents/document.md)
- [`knowledge.md`](./prompts/agents/knowledge.md)
- [`compliance.md`](./prompts/agents/compliance.md)
- [`schedule_risk.md`](./prompts/agents/schedule_risk.md)
- [`procurement.md`](./prompts/agents/procurement.md)
- [`commissioning.md`](./prompts/agents/commissioning.md)
- [`risk_analysis.md`](./prompts/agents/risk_analysis.md)
- [`executive_copilot.md`](./prompts/agents/executive_copilot.md)
- [`reporting.md`](./prompts/agents/reporting.md)
- [`recommendation.md`](./prompts/agents/recommendation.md)
- [`mitigation_planner.md`](./prompts/agents/mitigation_planner.md)
- [`project_health.md`](./prompts/agents/project_health.md)
- [`data_validation.md`](./prompts/agents/data_validation.md)

## Development Prompts

Reusable prompts for code generation, review, debugging, and documentation:

- [`prompts/backend.md`](./prompts/backend.md)
- [`prompts/frontend.md`](./prompts/frontend.md)
- [`prompts/database.md`](./prompts/database.md)
- [`prompts/testing.md`](./prompts/testing.md)
- [`prompts/implement.md`](./prompts/implement.md)
- [`prompts/review.md`](./prompts/review.md)
- [`prompts/debug.md`](./prompts/debug.md)
- [`prompts/optimize.md`](./prompts/optimize.md)
- [`prompts/refactor.md`](./prompts/refactor.md)
- [`prompts/documentation.md`](./prompts/documentation.md)
