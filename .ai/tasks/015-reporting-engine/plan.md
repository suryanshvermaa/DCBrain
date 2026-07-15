# Task 015: Reporting Engine — Implementation Plan

**Status: Completed**

## Execution Order

### Step 1: Schema & Storage (60 min)
1. Define `reports` Prisma model with type, status, format, storage key.
2. Configure MinIO bucket for report artefacts.

### Step 2: Report Templates (90 min)
1. Build template engine for daily, weekly, executive, compliance, risk, procurement.
2. Define section aggregators that call module services.
3. Add AI summary generation per section.

### Step 3: Generation & Export (120 min)
1. Implement `POST /reports/generate` endpoint.
2. Generate Markdown and queue PDF conversion worker.
3. Use Puppeteer or wkhtmltopdf in worker container.

### Step 4: Scheduling (60 min)
1. Add daily/weekly BullMQ schedules.
2. Implement report distribution via notifications.

### Step 5: UI (90 min)
1. Build reports list page.
2. Add preview and download actions.
3. Add "generate now" button.

### Step 6: Tests & Docs (60 min)
1. Unit tests for aggregators.
2. Integration tests for generation and download.
3. Update FEATURES.md, AGENTS.md, API.md, DATABASE.md.

## Validation

- Generate an executive report and verify PDF download.
- Confirm scheduled daily report runs without errors.
- Check AI summaries cite actual sources.
