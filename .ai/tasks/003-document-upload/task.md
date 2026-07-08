# Task 003: Document Upload

## Overview
- **ID:** 003
- **Priority:** P0 (Critical)
- **Estimate:** 6 hours
- **Sprint:** 1
- **Dependencies:** 001 (Project Setup), 002 (Authentication)
- **Status:** Completed

## Objective

Implement document upload, storage, categorization, and management UI. Users can upload PDF, DOCX, XLSX, CSV, JSON, XML (P6), and image files (PNG/JPG/TIFF). Documents are stored in MinIO, metadata is saved to PostgreSQL, and documents appear in a filterable list with status tracking.

## Acceptance Criteria

- [x] Upload endpoint accepts multipart file uploads (`POST /api/v1/projects/{id}/documents/upload`)
- [x] Supported formats: PDF, DOCX, XLSX, CSV, XML (P6), JSON, PNG, JPG, TIFF
- [x] File size validation (max 100MB per file)
- [x] File type validation by magic bytes/content structure (not just extension)
- [x] Batch upload (up to 50 files)
- [x] Document metadata extraction (filename, size, mime type)
- [x] Document stored in MinIO bucket under project-scoped, UUID-based object key
- [x] MinIO bucket configured in Docker Compose and ensured by backend; objects remain private by default
- [x] Presigned URL endpoint for secure document download/preview
- [x] Database record created with status `QUEUED`
- [x] Document list endpoint with pagination, sorting, and filtering
- [x] Document detail endpoint with metadata
- [x] Document delete endpoint (soft delete)
- [x] Frontend drag-and-drop upload component
- [x] Upload progress indicator
- [x] Document list page with category filter and search
- [x] Document detail panel
- [x] Database migrations for `documents` and `document_versions` tables
- [x] Projects table and project_members table migrations

## Reference Documents
- [API.md](../../API.md) — Document endpoint specifications
- [DATABASE.md](../../DATABASE.md) — Documents table schema
- [COMPONENTS.md](../../COMPONENTS.md) — DocumentList, FileUpload, DocumentCard components
- [UI_GUIDELINES.md](../../UI_GUIDELINES.md) — Document management page design
- [SECURITY.md](../../SECURITY.md) — File upload validation and access control
