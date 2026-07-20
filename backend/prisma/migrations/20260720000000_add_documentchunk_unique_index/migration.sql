-- Deduplicate any existing rows that would violate the new unique constraint,
-- keeping the earliest-created chunk per (documentId, chunkIndex).
DELETE FROM "document_chunks" a
USING "document_chunks" b
WHERE a."documentId" = b."documentId"
  AND a."chunkIndex" = b."chunkIndex"
  AND a."createdAt" > b."createdAt";

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_documentId_chunkIndex_key" ON "document_chunks"("documentId", "chunkIndex");
