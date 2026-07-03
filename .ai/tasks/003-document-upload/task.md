# Task 003: Document Upload

## Overview
- **ID:** 003
- **Priority:** P0 (Critical)
- **Estimate:** 6 hours
- **Sprint:** 1
- **Dependencies:** 001 (Project Setup), 002 (Authentication)
- **Status:** Not Started

## Objective

Implement document upload, storage, categorization, and management UI. Users can upload PDF, DOCX, XLSX, CSV, JSON, XML (P6), and image files (PNG/JPG/TIFF). Documents are stored in MinIO, metadata is saved to PostgreSQL, and documents appear in a filterable list with status tracking.

## Acceptance Criteria

- [ ] Upload endpoint accepts multipart file uploads (`POST /api/v1/projects/{id}/documents/upload`)
- [ ] Supported formats: PDF, DOCX, XLSX, CSV, XML (P6), JSON, PNG, JPG, TIFF
- [ ] File size validation (max 100MB per file)
- [ ] File type validation by magic bytes (not just extension)
- [ ] Batch upload (up to 50 files)
- [ ] Document metadata extraction (filename, size, mime type)
- [ ] Document stored in MinIO bucket under project-scoped, UUID-based object key
- [ ] MinIO bucket and access policies configured in Docker Compose
- [ ] Presigned URL endpoint for secure document download/preview
- [ ] Database record created with status "queued"
- [ ] Document list endpoint with pagination, sorting, and filtering
- [ ] Document detail endpoint with metadata
- [ ] Document delete endpoint (soft delete)
- [ ] Frontend drag-and-drop upload component
- [ ] Upload progress indicator
- [ ] Document list page with category filter and search
- [ ] Document detail panel
- [ ] Database migrations for `documents` and `document_versions` tables
- [ ] Projects table and project_members table migrations

## Reference Documents
- [API.md](../../API.md) — Document endpoint specifications
- [DATABASE.md](../../DATABASE.md) — Documents table schema
- [COMPONENTS.md](../../COMPONENTS.md) — DocumentList, FileUpload, DocumentCard components
- [UI_GUIDELINES.md](../../UI_GUIDELINES.md) — Document management page design
- [SECURITY.md](../../SECURITY.md) — File upload validation and access control
