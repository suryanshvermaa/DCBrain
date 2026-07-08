-- Add document filtering metadata and soft delete support.
ALTER TABLE "documents"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'uncategorized',
  ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "documents"
  ALTER COLUMN "status" SET DEFAULT 'QUEUED';

CREATE INDEX "documents_category_idx" ON "documents"("category");
CREATE INDEX "documents_deletedAt_idx" ON "documents"("deletedAt");

-- Store immutable raw-file snapshots for future re-upload/version workflows.
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_versions_documentId_version_key" ON "document_versions"("documentId", "version");
CREATE INDEX "document_versions_documentId_idx" ON "document_versions"("documentId");
CREATE INDEX "document_versions_uploadedById_idx" ON "document_versions"("uploadedById");

ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
