# Database Design

**Engine:** PostgreSQL 16.x (Relational/JSON/Full-text), ChromaDB (Vector embeddings), MinIO (Object/File Storage), and **Neo4j 5.x** (Graph DB for Node/Edge tracking, Knowledge Graph, and Failure Propagation). See [DECISIONS.md](./DECISIONS.md) ADR-010.

## Schema Overview
```mermaid
erDiagram
    users ||--o{ project_members : "has"
    users ||--o{ audit_log : "records"
    projects ||--o{ project_members : "includes"
    users ||--o{ projects : "creates"
    projects ||--o{ documents : "contains"
    projects ||--o{ rfis : "contains"
    projects ||--o{ schedules : "contains"
    documents ||--o{ document_versions : "has"
    documents ||--o{ chunks : "split_into"
    documents ||--o{ compliance_checks : "validated_in"
    projects ||--o{ simulations : "runs"
    projects ||--o{ ncrs : "tracks"
    projects ||--o{ change_orders : "tracks"
```

## Expected Tables
- `users`, `projects`, `project_members`, `documents`, `document_versions`, `chunks`
- `chat_sessions`, `chat_messages`: Created in Task 006 for Project Chat.
- `rfis`: Requests for Information tracking.
- `compliance_checks`: Validation results.
- `schedule_activities`: P6 imported activities.
- `procurement_items`, `vendors`: POs, statuses, vendor scoring.
- `audit_log`, `agent_runs`
- **NEW:** `simulations` (What-if scenario tracking)
- **NEW:** `ncrs` (Non-Conformance Reports)
- **NEW:** `change_orders` (Project financial/scope changes)

### Audit Log

- `audit_log` stores auth events, RBAC-sensitive actions, and other notable user activity.
- Columns include `action`, `resourceType`, `resourceId`, `details`, `ipAddress`, `userAgent`, `createdAt`, and optional `userId`.

### Documents

- `documents` stores uploaded file metadata, MinIO bucket/path, project/owner links, category, processing status, timestamps, and `deletedAt` for soft delete.
- New uploads start at `DocumentStatus.QUEUED`; Task 004 is responsible for moving documents through processing/completed/failed states.
- `document_versions` stores immutable raw-file snapshots for each document version. Task 003 creates version `1` during initial upload.
- MinIO object keys are project-scoped and UUID-based: `projects/{projectId}/documents/{uuid}/{sanitizedFilename}`.

## Vector Store (ChromaDB)
- `project_{id}_documents`: Document chunk embeddings.
- `project_{id}_standards`: Industry standard embeddings.

## Object Storage (MinIO)
- Secure, S3-compatible storage for uploaded PDFs, Images, DOCX, and Excel files.
