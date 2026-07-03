# Actionable Tasks

This file is the high-level task index. Detailed task definitions live in [tasks/](./tasks/); sprint allocation lives in [tasks/sprint.md](./tasks/sprint.md); the full backlog lives in [tasks/backlog.md](./tasks/backlog.md).

## Current Sprint

See [tasks/sprint.md](./tasks/sprint.md) for the active sprint. As of the latest update, **Sprint 1 — Foundation** is active and **Task 001 — Project Setup** is the immediate next task (also see [NEXT_CHAT.md](./NEXT_CHAT.md)).

---

## P0 — Critical (Must Have for Hackathon Demo)

| ID | Task | Sprint | Estimate | Status |
|----|------|--------|----------|--------|
| 001 | [Project Setup](./tasks/001-project-setup/task.md) | 1 | 4h | Not Started |
| 002 | [Authentication](./tasks/002-authentication/task.md) | 1 | 6h | Not Started |
| 003 | [Document Upload](./tasks/003-document-upload/task.md) | 1 | 6h | Not Started |
| 004 | [Document Processing](./tasks/004-document-processing/task.md) | 2 | 8h | Not Started |
| 005 | [RAG Search](./tasks/005-rag/task.md) | 2 | 8h | Not Started |
| 006 | [Chat Interface](./tasks/006-chat/task.md) | 2 | 6h | Not Started |
| 009 | [Dashboard](./tasks/009-dashboard/task.md) | 3 | 8h | Not Started |
| 014 | [AI Agent Framework & Supervisor](./tasks/014-ai-agent-framework/task.md) | 5 | 12h | Not Started |

---

## P1 — High (MVP Scope)

| ID | Task | Sprint | Estimate | Status |
|----|------|--------|----------|--------|
| 007 | [Compliance Checker](./tasks/007-compliance-checker/task.md) | 3 | 10h | Not Started |
| 008 | [Schedule Risk](./tasks/008-schedule-risk/task.md) | 4 | 8h | Not Started |
| 010 | [Deployment](./tasks/010-deployment/task.md) | 6 | 6h | Not Started |
| 011 | [Procurement Intelligence](./tasks/011-procurement-intelligence/task.md) | 4 | 10h | Not Started |
| 012 | [RFI Intelligence](./tasks/012-rfi-intelligence/task.md) | 4 | 8h | Not Started |
| 013 | [Knowledge Graph & Entity Extraction](./tasks/013-knowledge-graph/task.md) | 4 | 10h | Not Started |
| 015 | [Reporting Engine](./tasks/015-reporting-engine/task.md) | 5 | 8h | Not Started |
| 016 | [Simulation & Mitigation Planner](./tasks/016-simulation-engine/task.md) | 5 | 10h | Not Started |
| 017 | [Notifications, Audit Logs & Activity Timeline](./tasks/017-notifications-audit/task.md) | 3 | 6h | Not Started |

---

## P2 — Medium (Enhancement / Stretch)

| ID | Task | Sprint | Estimate | Status |
|----|------|--------|----------|--------|
| 018 | [Advanced EPC Intelligence](./tasks/018-advanced-epc-intelligence/task.md) | 5 | 12h | Not Started |

---

## Dependency Graph (Key Paths)

```text
001 Project Setup
├── 002 Authentication
│   └── 003 Document Upload
│       ├── 004 Document Processing
│       │   ├── 005 RAG Search
│       │   │   ├── 006 Chat Interface
│       │   │   ├── 007 Compliance Checker
│       │   │   └── 012 RFI Intelligence
│       │   └── 013 Knowledge Graph
│       │       ├── 014 AI Agent Framework
│       │       │   ├── 015 Reporting Engine
│       │       │   └── 016 Simulation Engine
│       │       └── 018 Advanced EPC Intelligence
│       └── 011 Procurement Intelligence
└── 009 Dashboard
    └── 017 Notifications & Audit

010 Deployment depends on all above.
```

---

## Blocked

- [ ] Task 018 — Advanced EPC Intelligence: partially blocked on basic RFI (Task 012) and Agent Framework (Task 014).

## Future Ideas

- Multi-project portfolio view and cross-project analytics
- Integration Hub (Procore, Aconex, Microsoft Teams, Power BI)
- Mobile PWA for field access
- BIM model integration and spatial search
- Industry benchmark database
- Advanced supply-chain risk signals
