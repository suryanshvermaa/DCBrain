# Task 018: Advanced EPC Intelligence (NCR, Inspection, Commissioning, Quality)

## Overview
- **ID:** 018
- **Priority:** P2 (Medium)
- **Estimate:** 12 hours
- **Sprint:** 5
- **Dependencies:** 003 (Document Upload), 004 (Document Processing), 007 (Compliance), 012 (RFI), 014 (Agent Framework)
- **Status:** Completed ✅
- **Completed At:** 2026-07-16

## Objective

Build the advanced EPC Intelligence modules beyond compliance: Non-Conformance Reports (NCR), Inspection Intelligence, Commissioning Copilot, Quality Assurance support, and Change Order analysis. These modules leverage the Document Agent and Knowledge Graph to extract, link, and validate field records against design intent.

## Acceptance Criteria

### NCR Analysis
- [ ] NCR import/creation endpoints
- [ ] `ncrs` table with number, description, severity, status, related document, related RFI, resolution
- [ ] NCR trend analytics and dashboard widget
- [ ] Link NCRs to specifications, RFIs, and vendor performance

### Inspection Intelligence
- [ ] Inspection/Test Plan (ITP) parsing and tracking
- [ ] Inspection record upload and status tracking
- [ ] Missing inspection / overdue hold-point detection
- [ ] Inspection summary by discipline and vendor

### Commissioning Copilot
- [ ] Commissioning script/procedure parsing
- [ ] Commissioning test record upload and validation
- [ ] Cx status tracking: not started → in progress → passed → failed → closed
- [ ] Missing test / failed test alerts
- [ ] Commissioning Agent integration (Task 014)

### Quality Assurance
- [ ] Quality dashboard aggregating NCRs, inspections, commissioning status
- [ ] Quality score sub-component of project health score

### Change Orders
- [ ] Change Order import/creation endpoints
- [ ] `change_orders` table with number, description, cost impact, schedule impact, status
- [ ] Link change orders to affected documents and schedule activities

### Common
- [ ] Frontend module pages: NCRs, Inspections, Commissioning, Change Orders
- [ ] Database migrations for `ncrs`, `inspections`, `commissioning_records`, `change_orders`
- [ ] Integration tests for each module's endpoints

## Required APIs

- `GET/POST /api/v1/projects/{id}/ncrs`
- `GET/POST /api/v1/projects/{id}/inspections`
- `GET/POST /api/v1/projects/{id}/commissioning`
- `GET/POST /api/v1/projects/{id}/change-orders`
- `GET /api/v1/projects/{id}/quality/summary`

## Required Database Changes

- Create `ncrs` table
- Create `inspections` table
- Create `commissioning_records` table
- Create `change_orders` table
- Add status enums for each

## Required Tests

- Unit tests for status transition rules
- Integration tests for each CRUD module
- AI pipeline tests for record-to-spec matching

## Required Documentation

- Update [FEATURES.md](../../FEATURES.md) relevant P2/P3 features
- Update [AGENTS.md](../../AGENTS.md) Commissioning Agent, Risk Analysis Agent status
- Update [API.md](../../API.md) with NCR/Inspection/Commissioning/Change Order endpoints
- Update [DATABASE.md](../../DATABASE.md) with new schema

## Required Mermaid Diagram Updates

- Add EPC Intelligence modules to [ARCHITECTURE.md](../../ARCHITECTURE.md)

## Technical Details

- Reuse Document Processing pipeline for parsing uploaded records
- Use Knowledge Graph to link records to equipment, vendors, and specs
- Commissioning validation uses Compliance Agent patterns against Cx scripts
- Quality score = weighted average of NCR rate, inspection pass rate, commissioning pass rate

## Reference Documents

- [FEATURES.md](../../FEATURES.md) — EPC Intelligence features
- [AGENTS.md](../../AGENTS.md) — Commissioning Agent, Risk Analysis Agent
- [DATABASE.md](../../DATABASE.md) — Schema for NCRs, inspections, commissioning, change orders
- [DOMAIN.md](../../DOMAIN.md) — EPC domain terminology
