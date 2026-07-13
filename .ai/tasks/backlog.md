# Task Backlog

Prioritized list of tasks not yet assigned to a sprint. Tasks move from here to [sprint.md](./sprint.md) during sprint planning.

---

## Priority Legend

| Priority | Label | Definition |
|----------|-------|-----------|
| P0 | Critical | Must be done immediately |
| P1 | High | Must be done this sprint |
| P2 | Medium | Should be done soon |
| P3 | Low | Can wait |

---

## Backlog

| ID | Task | Priority | Estimate | Dependencies | Status |
|----|------|----------|----------|--------------|--------|
| 001 | [Project Setup](./001-project-setup/task.md) | P0 | 4h | None | Sprint 1 |
| 002 | [Authentication](./002-authentication/task.md) | P0 | 6h | 001 | Sprint 1 |
| 003 | [Document Upload](./003-document-upload/task.md) | P0 | 6h | 001, 002 | Sprint 1 |
| 004 | [Document Processing](./004-document-processing/task.md) | P0 | 8h | 003 | Sprint 2 |
| 005 | [RAG Search](./005-rag/task.md) | P0 | 8h | 004 | Sprint 2 |
| 006 | [Chat Interface](./006-chat/task.md) | P0 | 6h | 005 | Sprint 2 |
| 007 | [Compliance Checker](./007-compliance-checker/task.md) | P1 | 10h | 005 | Sprint 3 |
| 008 | [Schedule Risk](./008-schedule-risk/task.md) | P0 | 8h | 001 | Sprint 3 |
| 009 | [Dashboard](./009-dashboard/task.md) | P0 | 8h | 001-006 | Sprint 3 |
| 010 | [Deployment](./010-deployment/task.md) | P1 | 6h | All | Sprint 6 |
| 011 | [Procurement Intelligence](./011-procurement-intelligence/task.md) | P1 | 10h | 003, 004, 009 | Sprint 4 |
| 012 | [RFI Intelligence](./012-rfi-intelligence/task.md) | P1 | 8h | 003, 005, 006 | Sprint 4 |
| 013 | [Knowledge Graph & Entity Extraction](./013-knowledge-graph/task.md) | P1 | 10h | 004 | Completed |
| 014 | [AI Agent Framework & Supervisor](./014-ai-agent-framework/task.md) | P0 | 12h | 004, 005, 006, 013 | Sprint 5 |
| 015 | [Reporting Engine](./015-reporting-engine/task.md) | P1 | 8h | 007, 008, 011, 012, 014 | Sprint 5 |
| 016 | [Simulation & Mitigation Planner](./016-simulation-engine/task.md) | P0 | 10h | 008, 013, 014 | Sprint 3 |
| 017 | [Notifications, Audit Logs & Activity Timeline](./017-notifications-audit/task.md) | P1 | 6h | 002, 009 | Sprint 3 |
| 018 | [Advanced EPC Intelligence](./018-advanced-epc-intelligence/task.md) | P2 | 12h | 003, 004, 007, 012, 014 | Sprint 5 |

---

## Sprint Allocation Summary

| Sprint | Theme | Tasks |
|--------|-------|-------|
| 1 | Foundation | 001, 002, 003 |
| 2 | RAG & Chat | 004, 005, 006 |
| 3 | Simulation, Dashboard & Risk | 007, 008, 009, 016, 017 |
| 4 | Procurement, RFI, Knowledge Graph | 011, 012, 013 |
| 5 | Agents, Reports, Advanced EPC | 014, 015, 018 |
| 6 | Production Deployment | 010 |

> For the 48-hour hackathon, the team should aim to complete Sprint 1 + Sprint 2 + Sprint 3 (Dashboard, Schedule Risk, Simulation) as the minimum viable demo, focusing heavily on the PRISM failure simulation. Tasks 011, 012, 013 are valuable stretch goals if time permits.

---

## Future Tasks (Post-MVP)

- Multi-project portfolio view and cross-project analytics
- Integration Hub (Procore, Aconex, Microsoft Teams, Power BI)
- Mobile PWA for field access
- BIM model integration and spatial search
- Automated regulatory update tracking
- Industry benchmark database
- Advanced supply-chain risk signals (market indices, geopolitics)
