# Task 015: Reporting Engine

## Overview
- **ID:** 015
- **Priority:** P1 (High)
- **Estimate:** 8 hours
- **Sprint:** 5
- **Dependencies:** 007 (Compliance), 008 (Schedule Risk), 011 (Procurement), 012 (RFI), 014 (Agent Framework)
- **Status:** Not Started

## Objective

Build the Reporting Engine that generates daily, weekly, executive, compliance, risk, and procurement reports. Reports aggregate data from all modules, are AI-summarized where appropriate, and can be exported as PDF or Markdown.

## Acceptance Criteria

- [ ] Report template system (daily, weekly, executive, compliance, risk, procurement)
- [ ] Report generation endpoint (`POST /api/v1/projects/{id}/reports/generate`)
- [ ] Report list endpoint (`GET /api/v1/projects/{id}/reports`)
- [ ] Report detail/download endpoint (`GET /api/v1/projects/{id}/reports/{reportId}`)
- [ ] Markdown rendering with sections: Executive Summary, Schedule, Procurement, Compliance, Risks, RFIs, Recommendations
- [ ] PDF export via headless renderer (Puppeteer or wkhtmltopdf)
- [ ] Scheduled daily/weekly report generation via BullMQ
- [ ] Report storage in MinIO
- [ ] AI-generated summaries and recommendations per section
- [ ] Frontend reports page with generate, preview, download actions
- [ ] Database migration for `reports` table
- [ ] Unit tests for report aggregation; integration tests for report endpoints

## Required APIs

- `POST /api/v1/projects/{id}/reports/generate`
- `GET /api/v1/projects/{id}/reports`
- `GET /api/v1/projects/{id}/reports/{reportId}`
- `GET /api/v1/projects/{id}/reports/{reportId}/download?format=pdf|md`

## Required Database Changes

- Create `reports` table
- Add report type enum

## Required Tests

- Unit tests for report section aggregation
- Integration tests for report generation and download
- AI pipeline tests for summary quality

## Required Documentation

- Update [FEATURES.md](../../FEATURES.md) F-016 status when complete
- Update [AGENTS.md](../../AGENTS.md) Reporting Agent status
- Update [API.md](../../API.md) with report endpoints
- Update [DATABASE.md](../../DATABASE.md) with reports schema

## Required Mermaid Diagram Updates

- Add reporting flow to [ARCHITECTURE.md](../../ARCHITECTURE.md)

## Technical Details

- Report generation triggered manually or by Reporting Agent schedule
- Use `puppeteer` or `wkhtmltopdf` in a dedicated worker container for PDF conversion
- Store generated PDF/Markdown in MinIO; keep metadata in PostgreSQL
- Section data fetched from existing module endpoints/services
- AI summary generated with Gemini 2.5 Flash

## Reference Documents

- [FEATURES.md](../../FEATURES.md) — F-016 Automated Report Generation
- [AGENTS.md](../../AGENTS.md) — Reporting Agent
- [TECH_STACK.md](../../TECH_STACK.md) — BullMQ, MinIO
- [DATABASE.md](../../DATABASE.md) — Reports schema
