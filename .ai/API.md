# REST API Specification

**Base URL:** `/api/v1`
**Auth:** Bearer JWT required for all endpoints (except login/register/refresh).

Frontend clients must call the API with the `/api/v1` prefix. Do not drop the `/api` segment when wiring browser requests.

## Authentication & Projects
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`
- `GET /projects`, `POST /projects`, `GET /projects/{id}`
- `GET /projects/{id}/members`: Fetch name, email, and roles of project members

Auth endpoints return the access token in the JSON response and set the refresh token as an HttpOnly cookie scoped to `/api/v1/auth`.

## Documents & Search
- `POST /projects/{id}/documents/upload`: Multipart batch upload using form field `files` (up to 50 files, 100MB each) and optional `category`; stores private objects in MinIO and creates `QUEUED` document records.
- `GET /projects/{id}/documents`: Paginated list with `page`, `pageSize`, `search`, `category`, `status`, `sortBy`, and `sortOrder`.
- `GET /projects/{id}/documents/{documentId}`: Document detail with metadata, owner, and version history.
- `GET /projects/{id}/documents/{documentId}/download-url`: Presigned private MinIO download/preview URL.
- `DELETE /projects/{id}/documents/{documentId}`: Soft delete document metadata; deleted documents are hidden from list/detail/download.
- `POST /projects/{id}/search`: RAG & Semantic search

## Chat & Agents
- `POST /projects/{id}/chat/sessions`: Create context-aware chat
- `GET /projects/{id}/agents`: List all 14 agents with schedule config and latest run status
- `POST /projects/{id}/agents/{type}/run`: Manual trigger (body: `query`, `documentIds`, `standards`, `notes`, `runAsync`)
- `GET /projects/{id}/agents/runs`: Agent run history (optional `?agentType=` filter)
- `GET /projects/{id}/agents/runs/{runId}`: Single run detail with input/output
- `PUT /projects/{id}/agents/schedule`: Configure cron schedule for an agent (requires `configure_agents` permission)

## EPC Intelligence
- `POST /projects/{id}/compliance/check`: Run standards check
- `POST /projects/{id}/procurement/import`: Import procurement CSV/XLSX
- `GET /projects/{id}/procurement`: List procurement items
- `GET /projects/{id}/procurement/vendors`: List vendors and scorecards
- `GET /projects/{id}/procurement/alternatives/{itemId}`: AI alternatives for item
- `GET /projects/{id}/rfis`: List RFIs with optional status, overdue, and assigneeId query filters
- `POST /projects/{id}/rfis`: Create a new RFI (subject, question, priority, discipline, dueDate, assigneeId, documentIds)
- `GET /projects/{id}/rfis/{rfiId}`: Fetch detailed RFI with linked documents and suggested answer
- `PUT /projects/{id}/rfis/{rfiId}`: Update RFI parameters (fields, status, assignee, resolution, document links)
- `POST /projects/{id}/rfis/{rfiId}/suggest-answer`: Trigger RAG AI pipeline to suggest draft response
- `GET /projects/{id}/rfis/analytics`: Fetch RFI overview statistics, aging buckets, and average resolution times
- `GET /projects/{id}/ncrs`: List Non-Conformance Reports
- `GET /projects/{id}/change-orders`: List Change Orders
- `POST /projects/{id}/reports/generate`: Generate a new report. Body: `{ type: DAILY|WEEKLY|EXECUTIVE|COMPLIANCE|RISK|PROCUREMENT, runAsync?: boolean }`. Returns `{ reportId, status, report? }`.
- `GET /projects/{id}/reports`: List generated reports. Query: `?type=`, `?page=`, `?pageSize=`. Returns `{ reports, total, page, pageSize }`.
- `GET /projects/{id}/reports/{reportId}`: Report detail with Markdown content and metadata.
- `GET /projects/{id}/reports/{reportId}/download`: Download report. Query: `?format=pdf|md`. Returns presigned URL (PDF) or raw Markdown content.

## Schedule & Simulations
- `POST /projects/{id}/schedule/import`: Import Primavera P6 XML
- `POST /projects/{id}/simulations/delay`: Run Delay/What-if Simulation
- `GET /projects/{id}/simulations/{sim_id}`: View Simulation results & Mitigation plans

## Knowledge Graph
- `GET /projects/{id}/graph/dependencies`: Get Project Dependency Graph
- `GET /projects/{id}/graph/failures`: Get Failure Propagation Graph
