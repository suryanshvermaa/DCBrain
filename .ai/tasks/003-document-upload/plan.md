# Task 003: Document Upload — Implementation Plan

## Execution Order

### Step 1: Database Schema (30 min)
1. Create Prisma migrations for `projects`, `project_members`, `documents`, and `document_versions` tables.
2. Create corresponding Prisma models.

### Step 2: Backend Upload Service (90 min)
1. Create `src/modules/documents/schema.ts` with Zod schemas.
2. Create `src/modules/documents/repository.ts`.
3. Create `src/modules/documents/service.ts` with upload, list, get, delete methods.
4. Implement file validation (magic bytes, extension whitelist, 100MB size limit).
5. Implement MinIO storage with project-scoped, UUID-based object keys.
6. Create project service and repository for project CRUD.

### Step 3: Backend Upload Endpoints (60 min)
1. Create `src/modules/documents/routes.ts` router.
2. Create `src/modules/projects/routes.ts` router.
3. Implement multipart file upload handling (single + batch up to 50).
4. Implement pagination, sorting, and filtering on document list.
5. Add RBAC checks on all endpoints.

### Step 4: Frontend Upload UI (90 min)
1. Create `src/components/common/FileUpload.tsx` (drag-and-drop).
2. Create `src/components/documents/DocumentUploadModal.tsx`.
3. Create `src/components/documents/DocumentList.tsx`.
4. Create `src/components/documents/DocumentCard.tsx`.
5. Create `src/components/documents/DocumentFilterBar.tsx`.
6. Create `src/app/projects/[id]/documents/page.tsx`.
7. Create `src/lib/api/documents.ts` and `src/hooks/useDocuments.ts`.

## Validation
- Upload a PDF file → document appears in list with "queued" status.
- Upload a file > 100MB → 413 error.
- Upload a .exe file renamed to .pdf → rejected by magic byte check.
- Batch upload 10 files → all queued and listed.
- List documents with category filter → correct results.
- Delete a document → soft-deleted, not shown in list.
