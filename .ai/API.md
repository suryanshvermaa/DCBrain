# REST API Specification

**Base URL:** `/api/v1`
**Auth:** Bearer JWT required for all endpoints (except login/register).

## Authentication & Projects
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /projects`, `POST /projects`, `GET /projects/{id}`

## Documents & Search
- `POST /projects/{id}/documents/upload`: Bulk/Multipart upload (Stored in MinIO)
- `GET /projects/{id}/documents`: List & filter
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
