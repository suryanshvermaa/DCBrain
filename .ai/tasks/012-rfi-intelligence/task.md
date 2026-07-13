# Task 012: RFI Intelligence

## Overview
- **ID:** 012
- **Priority:** P1 (High)
- **Estimate:** 8 hours
- **Sprint:** 4
- **Dependencies:** 003 (Document Upload), 005 (RAG Search), 006 (Chat Interface)
- **Status:** Completed

## Objective

Build the RFI Intelligence module: create and track Requests for Information, link them to related documents, use RAG to suggest answers from existing project knowledge, identify overdue RFIs, and surface resolution-path recommendations.

## Acceptance Criteria

- [x] RFI CRUD endpoints (`GET/POST/PUT /api/v1/projects/{id}/rfis`)
- [x] `rfis` table with number, subject, question, status, assignee, due date, raised_by, answered_by, resolution
- [x] RFI statuses: open, in-review, answered, closed, void
- [x] Link RFIs to one or more documents/specifications
- [x] AI-suggested answer generation based on RAG retrieval across project documents
- [x] Overdue RFI detection and dashboard alerts
- [x] RFI ageing and resolution-time analytics
- [x] Inline chat-style thread for RFI question/answer
- [x] Frontend RFI list with status/due-date filters
- [x] Frontend RFI detail with suggested answer and edit/approve workflow
- [x] Database migration for `rfis` table and document-RFI linking table
- [x] Unit tests for RFI status transitions; integration tests for RFI endpoints

## Required APIs

- `GET /api/v1/projects/{id}/rfis`
- `POST /api/v1/projects/{id}/rfis`
- `GET /api/v1/projects/{id}/rfis/{rfiId}`
- `PUT /api/v1/projects/{id}/rfis/{rfiId}`
- `POST /api/v1/projects/{id}/rfis/{rfiId}/suggest-answer`
- `GET /api/v1/projects/{id}/rfis/analytics`

## Required Database Changes

- Create `rfis` table
- Create `rfi_documents` junction table
- Add RFI status enum

## Required Tests

- Unit tests for overdue detection and ageing calculations
- Integration tests for RFI CRUD and suggestion endpoints
- AI pipeline tests for suggested-answer relevance

## Required Documentation

- Update [FEATURES.md](../../FEATURES.md) F-010 status when complete
- Update [AGENTS.md](../../AGENTS.md) RFI Tracker references (future: RFI Intelligence Agent)
- Update [API.md](../../API.md) with RFI endpoints
- Update [DATABASE.md](../../DATABASE.md) with RFI schema

## Required Mermaid Diagram Updates

- Add RFI workflow to [ARCHITECTURE.md](../../ARCHITECTURE.md) module communication diagram

## Technical Details

- Use RAG pipeline (Task 005) to retrieve context for suggested answers
- Suggested answers require human approval before becoming the official response
- Overdue logic runs daily via BullMQ scheduled job
- RFI ageing buckets: 0-7 days, 8-14 days, 15-30 days, >30 days

## Reference Documents

- [FEATURES.md](../../FEATURES.md) — F-010 RFI Management
- [REQUIREMENTS.md](../../REQUIREMENTS.md) — FR-010 (covered under AI Agents in Requirements; expanded here)
- [AGENTS.md](../../AGENTS.md) — Knowledge Agent, future RFI Intelligence Agent
- [DATABASE.md](../../DATABASE.md) — RFI schema
