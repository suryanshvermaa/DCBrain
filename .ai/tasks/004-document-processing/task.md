# Task 004: Document Processing Pipeline

## Overview
- **ID:** 004
- **Priority:** P0 (Critical)
- **Estimate:** 8 hours
- **Sprint:** 2
- **Dependencies:** 003 (Document Upload)
- **Status:** Completed

## Objective

Build the asynchronous document processing pipeline that extracts text from uploaded documents, splits it into chunks, generates vector embeddings, and stores them in ChromaDB for similarity search. This is the foundation of the RAG system.

## Acceptance Criteria

- [x] BullMQ worker processes documents asynchronously
- [x] PDF text extraction via pdf-parse with OCR fallback (Tesseract)
- [x] DOCX text extraction via `docx` (npm package)
- [x] XLSX/CSV data extraction via `xlsx` (npm package)
- [x] Image (PNG/JPG/TIFF) OCR via Tesseract.js with equipment-tag and diagram-symbol extraction where feasible
- [x] Table extraction preserved as formatted text
- [x] Text chunking with configurable chunk_size (512) and overlap (50)
- [x] Section headers preserved as chunk metadata
- [x] Page numbers tracked per chunk
- [x] Embedding generation via BAAI/bge-m3 (local or self-hosted endpoint)
- [x] Batch embedding (configurable batch size, default 100 chunks per call)
- [x] Embeddings stored in ChromaDB with document metadata
- [x] Chunk records created in PostgreSQL `chunks` table
- [x] Entity and relationship extraction; entities written to Neo4j Knowledge Graph (initial pass)
- [x] Document status updated through pipeline: queued → processing → completed/failed
- [x] Duplicate / near-duplicate detection via embedding similarity score
- [x] Failed processing retries 3 times with exponential backoff
- [x] Processing status endpoint returns real-time progress
- [x] Database migration for `chunks` table

## Reference Documents
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — Document processing data flow
- [AI_PIPELINES.md](../../AI_PIPELINES.md) — End-to-end pipeline diagram
- [DATABASE.md](../../DATABASE.md) — Chunks and entity tables schema
- [TECH_STACK.md](../../TECH_STACK.md) — AI/ML stack details
- [ENVIRONMENT.md](../../ENVIRONMENT.md) — Chunk size, embedding batch size configuration
- [AGENTS.md](../../AGENTS.md) — Document Agent responsibilities
