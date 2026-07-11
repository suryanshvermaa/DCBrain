# Next Chat Instructions

> This file tells any AI model exactly what to read and what to do when starting a new session.

## Current Status

**Date:** 2026-07-11  
**Phase:** Phase 1 — Foundation  
**Active Task:** 005 — RAG Search  
**Active Task File:** [tasks/005-rag-search/task.md](./tasks/005-rag-search/task.md)  
**Blocker:** None; the processing skeleton is implemented and verified by the backend test suite.

## Before Writing Any Code, Read These Files

### Mandatory Reading

1. [CURRENT_STATE.md](./CURRENT_STATE.md)
2. [state/current_task.json](./state/current_task.json)
3. [tasks/005-rag-search/](./tasks/005-rag-search/)

### Read For Context

4. [ARCHITECTURE.md](./ARCHITECTURE.md)
5. [TECH_STACK.md](./TECH_STACK.md)
6. [DATABASE.md](./DATABASE.md)
7. [API.md](./API.md)
8. [AI_PIPELINES.md](./AI_PIPELINES.md)
9. [AGENTS.md](./AGENTS.md)
10. [ENVIRONMENT.md](./ENVIRONMENT.md)
11. [SECURITY.md](./SECURITY.md)
12. [CODING_STANDARDS.md](./CODING_STANDARDS.md)

## Current Project Status

Project setup, authentication, and document upload are complete. The backend exposes `/api/v1/auth/*`, `/api/v1/projects`, and `/api/v1/projects/:id/documents/*`. The frontend has login/register, a protected dashboard, and a protected `/documents` page with project creation, project selection, filtering, upload progress, download links, soft delete, and document detail metadata.

Task 003 added private MinIO storage with project-scoped UUID object keys, content-based file validation, document metadata persistence, version `1` records, presigned download URLs, and soft delete. New document uploads now enqueue a processing job and update document status through a basic processing pipeline.

## Completed Work

- Task 001 — Project Setup
- Task 002 — Authentication
- Task 003 — Document Upload
- Task 004 — Document Processing completed (extraction, chunking, embeddings, Neo4j entities)

## Architecture Summary

DCBrain remains a modular monolith. Express modules own backend domains (`auth`, `projects`, `documents`), Prisma persists relational metadata, MinIO stores raw project documents privately, Redis/BullMQ will drive async work, ChromaDB will store embeddings, and Neo4j will store extracted entities/relationships.

## Important Decisions

- Frontend browser requests must use `NEXT_PUBLIC_API_URL` plus `/api/v1/*`.
- Auth access tokens remain in Redux memory only; refresh tokens remain HttpOnly cookies.
- Uploaded files are not publicly addressable. Preview/download goes through `/api/v1/projects/:id/documents/:documentId/download-url`.
- Users with `create_projects` permission can create a project from `/documents` using the New project modal.
- In a fresh DB, the first registered user is bootstrapped as `PROJECT_MANAGER`; later registrations default to `VIEWER`.
- MinIO object keys are `projects/{projectId}/documents/{uuid}/{sanitizedFilename}`.
- Soft delete sets `documents.deletedAt` and hides records from API reads; raw objects stay private in MinIO.
- Task 004 owns moving documents from `QUEUED` to `PROCESSING`, `PROCESSED`, or `FAILED`.

## Active Task

Task 005 — RAG Search.

Implement BullMQ-based asynchronous processing for queued uploads:

- extract text from PDFs, DOCX, XLSX, CSV, XML/JSON, and images
- OCR images and PDF fallback paths
- chunk text with metadata
- generate embeddings using BAAI/bge-m3 or the chosen local/self-hosted endpoint
- write chunks to PostgreSQL and vectors to ChromaDB
- start entity/relationship extraction for Neo4j
- update document status through the pipeline

## Remaining Work

- Start Task 005 — RAG Search implementation (retrieval logic using ChromaDB + Neo4j).
- Task 005 should integrate hybrid search via Prisma Full-Text and ChromaDB vector similarity.

## Next Recommended Task

Task 005 — RAG Search.

## Warnings

- `backend/dist`, `frontend/.next`, and Docker-created files may become root-owned. If host builds fail with `EACCES`, fix ownership narrowly.
- The frontend Docker service must keep `HOSTNAME=0.0.0.0`; otherwise Next standalone can try to resolve the container ID and restart-loop with `getaddrinfo EAI_AGAIN`.
- Frontend API clients must include `/api/v1`; stale `/v1/*` requests indicate a stale bundle or client regression.
- Prisma migration `20260708090000_document_upload` adds `QUEUED`, document category, soft delete, and `document_versions`.
- Task 003 migrations are split: `20260708090000_document_upload` adds `QUEUED`; `20260708090500_document_upload_tables` adds category/soft-delete/default/version table changes. Keep this split because PostgreSQL cannot safely use a newly added enum value as a default in the same migration transaction.
- The current processing path is a functional scaffold that stores chunks and metadata in PostgreSQL/ChromaDB; it still uses placeholder text extraction until the real extractors are added.
- Existing local demo users were promoted to `PROJECT_MANAGER` on 2026-07-08 to unblock project creation.

## Known Issues

- No dedicated document upload integration tests yet; current verification covered backend Jest tests and the core chunking regression case.
- The current document processing worker uses placeholder text extraction and should be upgraded once real extractors are implemented.

## Files The Next AI Should Read First

1. [CURRENT_STATE.md](./CURRENT_STATE.md)
2. [state/current_task.json](./state/current_task.json)
3. [tasks/005-rag-search/task.md](./tasks/005-rag-search/task.md)
4. [tasks/005-rag-search/plan.md](./tasks/005-rag-search/plan.md)
5. [DATABASE.md](./DATABASE.md)
6. [AI_PIPELINES.md](./AI_PIPELINES.md)
7. [backend/src/modules/documents/service.ts](../backend/src/modules/documents/service.ts)
8. [backend/prisma/schema.prisma](../backend/prisma/schema.prisma)
