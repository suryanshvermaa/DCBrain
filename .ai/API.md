# REST API Specification

**Base URL:** `/api/v1`
**Auth:** Bearer JWT required for all endpoints (except login/register/refresh).

Frontend clients must call the API with the `/api/v1` prefix. Do not drop the `/api` segment when wiring browser requests.

## Authentication & Projects
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`
- `GET /projects`, `POST /projects`, `GET /projects/{id}`

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
- `GET /projects/{id}/agents`: List all 14 Agents
- `POST /projects/{id}/agents/{type}/run`: Manual trigger

## EPC Intelligence
- `POST /projects/{id}/compliance/check`: Run standards check
- `GET /projects/{id}/ncrs`: List Non-Conformance Reports
- `GET /projects/{id}/change-orders`: List Change Orders
- `GET /projects/{id}/reports`: Fetch Executive/Daily reports

## Schedule & Simulations
- `POST /projects/{id}/schedule/import`: Import Primavera P6 XML
- `POST /projects/{id}/simulations/delay`: Run Delay/What-if Simulation
- `GET /projects/{id}/simulations/{sim_id}`: View Simulation results & Mitigation plans

## Knowledge Graph
- `GET /projects/{id}/graph/dependencies`: Get Project Dependency Graph
- `GET /projects/{id}/graph/failures`: Get Failure Propagation Graph
