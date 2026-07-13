# Task 011: Procurement Intelligence

## Overview
- **ID:** 011
- **Priority:** P1 (High)
- **Estimate:** 10 hours
- **Sprint:** 4
- **Dependencies:** 003 (Document Upload), 004 (Document Processing), 009 (Dashboard)
- **Status:** Not Started

## Objective

Build the Procurement Intelligence module: import procurement data (POs, line items, vendor master, delivery dates), track material status through the procurement pipeline, score vendor performance, flag at-risk and overdue items, and suggest alternative vendors for long-lead equipment.

## Acceptance Criteria

- [x] Procurement CSV/XLSX import endpoint (`POST /api/v1/projects/{id}/procurement/import`)
- [x] `procurement_items` table with PO number, line item, vendor, material, quantity, status, order date, promised date, required-on-site date, actual delivery date
- [x] Vendor master table with contact info and historical performance baseline
- [x] Procurement status pipeline: identified → RFQ → PO issued → in fabrication → shipped → received → installed
- [x] Lead-time tracking and critical-date alerts (items approaching required-on-site date)
- [x] Vendor performance scoring (on-time delivery %, NCR frequency, compliance hit rate)
- [x] Match procurement line items to relevant specifications via RAG
- [x] At-risk item dashboard card and filtered list view
- [x] Alternative vendor suggestions for high-risk long-lead items
- [x] Procurement dashboard widget in main project dashboard
- [x] Database migrations for `procurement_items` and `vendors`
- [x] Frontend procurement page with import, pipeline view, and vendor scorecards
- [x] Unit tests for procurement calculations; integration tests for import endpoint

## Required APIs

- `POST /api/v1/projects/{id}/procurement/import`
- `GET /api/v1/projects/{id}/procurement`
- `GET /api/v1/projects/{id}/procurement/{itemId}`
- `GET /api/v1/projects/{id}/procurement/alternatives/{itemId}`
- `GET /api/v1/projects/{id}/vendors`
- `GET /api/v1/projects/{id}/vendors/{vendorId}/scorecard`

## Required Database Changes

- Create `procurement_items` table
- Create `vendors` table
- Create `vendor_performance` table (or JSONB metrics inside `vendors`)
- Add procurement status enum

## Required Tests

- Unit tests for vendor score calculation
- Integration tests for CSV/XLSX import
- API tests for procurement endpoints
- AI pipeline tests for spec-to-PO matching

## Required Documentation

- Update [FEATURES.md](../../FEATURES.md) F-009 status when complete
- Update [AGENTS.md](../../AGENTS.md) Procurement Agent status
- Update [API.md](../../API.md) with procurement endpoints
- Update [DATABASE.md](../../DATABASE.md) with procurement schema

## Required Mermaid Diagram Updates

- Update Procurement Dashboard diagram in [ARCHITECTURE.md](../../ARCHITECTURE.md)

## Technical Details

- Use `xlsx` npm package for spreadsheet parsing
- Store raw import file in MinIO for audit/reprocessing
- Run spec matching asynchronously via BullMQ worker
- Vendor score formula: weighted average of on-time delivery (40%), quality/NCR (30%), compliance pass rate (30%)
- Alternative vendor suggestions powered by Gemini 2.5 Flash with vendor embeddings

## Reference Documents

- [REQUIREMENTS.md](../../REQUIREMENTS.md) — FR-008 Procurement Visibility Dashboard
- [FEATURES.md](../../FEATURES.md) — F-009 Procurement Visibility Dashboard
- [AGENTS.md](../../AGENTS.md) — Procurement Agent
- [TECH_STACK.md](../../TECH_STACK.md) — BullMQ, Gemini, BGE-M3
- [DATABASE.md](../../DATABASE.md) — Procurement schema
