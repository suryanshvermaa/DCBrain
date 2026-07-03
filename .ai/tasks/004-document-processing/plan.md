# Task 004: Document Processing — Implementation Plan

## Execution Order

### Step 1: BullMQ Configuration (30 min)
1. Configure BullMQ `Queue` and `Worker` in `src/workers/`.
2. Set up Redis as broker and result backend.
3. Configure job options, retry policies, and concurrency.
4. Create worker startup script (`src/workers/index.ts`).

### Step 2: Text Extraction (90 min)
1. Create `src/modules/rag/extractors/pdfExtractor.ts` using `pdf-parse` with Tesseract.js OCR fallback.
2. Create `src/modules/rag/extractors/docxExtractor.ts` using `docx`.
3. Create `src/modules/rag/extractors/xlsxExtractor.ts` using `xlsx`.
4. Create `src/modules/rag/extractors/imageExtractor.ts` using Tesseract.js for PNG/JPG/TIFF.
5. Create `src/modules/rag/extractors/base.ts` extractor interface and factory.
6. Handle edge cases: scanned PDFs, password-protected files, corrupted files.

### Step 3: Chunking Engine (60 min)
1. Create `src/modules/rag/chunker.ts`.
2. Implement recursive text splitter with section awareness.
3. Preserve section headers as metadata per chunk.
4. Track page number per chunk.
5. Configure `CHUNK_SIZE` and `CHUNK_OVERLAP` from environment variables.

### Step 4: Entity & Relationship Extraction (60 min)
1. Create `src/modules/rag/entityExtractor.ts`.
2. Use Gemini 2.5 Flash JSON mode to extract equipment, vendors, standards, activities, documents.
3. Normalize entity names and reconcile duplicates.
4. Write entities and relationships to Neo4j.

### Step 5: Embedding Generation (60 min)
1. Create `src/modules/rag/embedder.ts`.
2. Implement batch embedding via BAAI/bge-m3 (self-hosted or dedicated endpoint — never Gemini for embeddings).
3. Handle API rate limits with retry and backoff.
4. Store embeddings in ChromaDB with metadata (document_id, chunk_index, page_number, section_header, category).

### Step 6: Pipeline Orchestration (60 min)
1. Create `src/workers/documentProcessor.ts` BullMQ job handler.
2. Chain steps: extract → chunk → embed → entity extraction → update status.
3. Implement retry logic (3 attempts, exponential backoff).
4. Update document status at each pipeline stage: queued → processing → completed/failed.

### Step 7: Duplicate Detection (30 min)
1. Compute embedding similarity between new chunks and existing chunks.
2. Flag potential duplicates with similarity score.
3. Store duplicate detection results in PostgreSQL.

### Step 8: Status Tracking (30 min)
1. Add processing status endpoint to documents API.
2. Return progress percentage and current step.
3. Track step durations for performance monitoring.

## Validation
- Upload a 10-page PDF → processing completes, chunks visible in DB, embeddings in ChromaDB.
- Upload a scanned PDF → OCR fallback extracts text.
- Upload a PNG/JPG drawing → OCR extracts text and equipment tags.
- Simulate embedding API failure → retry 3 times with backoff.
- Check document status during processing → shows current step and progress.
- Re-process a document → Neo4j nodes updated idempotently.
