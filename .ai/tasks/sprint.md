# Sprint Plan

## Sprint 1 — Foundation

**Sprint Duration:** 2026-07-01 to 2026-07-14
**Sprint Goal:** Set up development environment and deliver core document management with authentication.

| ID | Task | Assignee | Status | Est. Hours |
|----|------|----------|--------|------------|
| 001 | [Project Setup](./001-project-setup/task.md) | — | ✅ Completed | 4h |
| 002 | [Authentication](./002-authentication/task.md) | — | ✅ Completed | 6h |
| 003 | [Document Upload](./003-document-upload/task.md) | — | ✅ Completed | 6h |

**Total Estimated Hours:** 16h

---

## Sprint 2 — RAG & Chat

**Sprint Duration:** 2026-07-15 to 2026-07-28
**Sprint Goal:** Build the document processing pipeline, hybrid RAG search, and AI chat interface.

| ID | Task | Assignee | Status | Est. Hours |
|----|------|----------|--------|------------|
| 004 | [Document Processing](./004-document-processing/task.md) | — | ✅ Completed | 8h |
| 005 | [RAG Search](./005-rag/task.md) | — | ✅ Completed | 8h |
| 006 | [Chat Interface](./006-chat/task.md) | — | ✅ Completed | 6h |

**Total Estimated Hours:** 22h

---

## Sprint 3 — Simulation, Dashboard & Risk

**Sprint Duration:** 2026-07-29 to 2026-08-11
**Sprint Goal:** Deliver project dashboard, schedule risk models, failure simulation engine, and compliance validation.

| ID | Task | Assignee | Status | Est. Hours |
|----|------|----------|--------|------------|
| 007 | [Compliance Checker](./007-compliance-checker/task.md) | — | 🔲 Not Started | 10h |
| 009 | [Dashboard](./009-dashboard/task.md) | — | 🔲 Not Started | 8h |
| 017 | [Notifications, Audit Logs & Activity Timeline](./017-notifications-audit/task.md) | — | 🔲 Not Started | 6h |
| 008 | [Schedule Risk & Math Models](./008-schedule-risk/task.md) | — | 🔲 Not Started | 8h |
| 016 | [Simulation & Mitigation Planner](./016-simulation-engine/task.md) | — | 🔲 Not Started | 10h |

**Total Estimated Hours:** 42h

---

## Sprint 4 — Procurement, RFI, Knowledge Graph

**Sprint Duration:** 2026-08-12 to 2026-08-25
**Sprint Goal:** Deliver procurement intelligence, RFI management, and the Neo4j Knowledge Graph.

| ID | Task | Assignee | Status | Est. Hours |
|----|------|----------|--------|------------|
| 011 | [Procurement Intelligence](./011-procurement-intelligence/task.md) | — | 🔲 Not Started | 10h |
| 012 | [RFI Intelligence](./012-rfi-intelligence/task.md) | — | 🔲 Not Started | 8h |
| 013 | [Knowledge Graph & Entity Extraction](./013-knowledge-graph/task.md) | — | 🔲 Not Started | 10h |

**Total Estimated Hours:** 28h

---

## Sprint 5 — Agents, Reports, Advanced EPC

**Sprint Duration:** 2026-08-26 to 2026-09-08
**Sprint Goal:** Build the AI Agent Framework with Supervisor, reporting engine, and advanced EPC intelligence modules.

| ID | Task | Assignee | Status | Est. Hours |
|----|------|----------|--------|------------|
| 014 | [AI Agent Framework & Supervisor](./014-ai-agent-framework/task.md) | — | 🔲 Not Started | 12h |
| 015 | [Reporting Engine](./015-reporting-engine/task.md) | — | 🔲 Not Started | 8h |
| 018 | [Advanced EPC Intelligence](./018-advanced-epc-intelligence/task.md) | — | 🔲 Not Started | 12h |

**Total Estimated Hours:** 32h

---

## Sprint 6 — Production Deployment

**Sprint Duration:** 2026-09-09 to 2026-09-22
**Sprint Goal:** Harden the application and ship production-ready deployment infrastructure.

| ID | Task | Assignee | Status | Est. Hours |
|----|------|----------|--------|------------|
| 010 | [Deployment](./010-deployment/task.md) | — | 🔲 Not Started | 6h |

**Total Estimated Hours:** 6h

---

## Sprint Progress Summary

- **Completed:** 6 / 18 tasks
- **In Progress:** 0
- **Not Started:** 12

---

## Sprint Notes

Sprint 1 focuses on foundation work. Task 001 (Project Setup) must be completed first as all other tasks depend on having the development environment running.

For the hackathon demo (48h sprint), the team should aim to complete **Sprint 1 + Sprint 2 + Sprint 3 (Dashboard, Schedule Risk, Simulation)** as the minimum viable demo, focusing heavily on the PRISM failure simulation. Tasks 011, 012, and 013 are valuable stretch goals if time permits.

---

## Definition of Done

A task is "done" when:
- [ ] Code is written and follows [CODING_STANDARDS.md](../CODING_STANDARDS.md)
- [ ] Tests are passing (backend: Jest, frontend: vitest)
- [ ] Task's `progress.md` is updated
- [ ] Task's `review.md` is filled in
- [ ] [PROJECT_STATE.md](../PROJECT_STATE.md) is updated
- [ ] [CHANGELOG.md](../CHANGELOG.md) is updated
