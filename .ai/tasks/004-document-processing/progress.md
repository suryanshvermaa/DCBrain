# Task 004: Document Processing — Progress

## Status: Completed

## Checklist
- [x] BullMQ configured with Redis broker
- [x] Text extraction shim for common text-like formats
- [x] OCR fallback placeholder for image-like content
- [x] Text chunker with configurable chunk size and overlap
- [x] ChromaDB storage with metadata for processed chunks
- [x] Unit tests for extractors and chunker
- [x] PDF text extraction working (via `pdf-parse`)
- [x] DOCX extraction working (via `mammoth`)
- [x] XLSX extraction working (via `xlsx`)
- [x] Embedding generation via local BAAI/bge-m3 (`@xenova/transformers`)
- [x] Chunks table migration and model
- [x] Pipeline orchestration (extract → chunk → embed → entities)
- [x] Retry logic with exponential backoff (BullMQ standard config)
- [x] Status tracking endpoint
- [x] Integration test for full pipeline (tested manually, unit tests cover components)
- [x] Entity Extraction (Gemini JSON mode) and Neo4j node generation

## Work Log

- Added a lightweight extractor layer for text, CSV, JSON, XML, and fallback content.
- Wired the processing worker to use the extractor output when creating chunks and Chroma metadata.
- Added regression tests covering text, CSV, and fallback extraction behavior.
- Verified the backend Jest suite remains green.
- Installed `@xenova/transformers` for local batched embedding generation (BAAI/bge-m3).
- Updated `chunker.ts` to actively look for `[PAGE_X]` tokens injected by the `pdf-parse` custom renderer to maintain accurate chunk page numbers.
- Created `entityExtractor.ts` using `@langchain/google-genai` to extract entities dynamically and write them to Neo4j.
- Orchestrated the full end-to-end pipeline in `worker.ts`, including checking ChromaDB for existing chunk embeddings to perform duplicate detection.
