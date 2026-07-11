-- CreateTable: search_history
CREATE TABLE "search_history" (
    "id"          TEXT NOT NULL,
    "query"       TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "cached"      BOOLEAN NOT NULL DEFAULT false,
    "filters"     JSONB,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId"   TEXT NOT NULL,
    "userId"      TEXT NOT NULL,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_history_projectId_idx" ON "search_history"("projectId");
CREATE INDEX "search_history_userId_idx" ON "search_history"("userId");
CREATE INDEX "search_history_createdAt_idx" ON "search_history"("createdAt");

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "search_history" ADD CONSTRAINT "search_history_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GIN full-text index on document_chunks.content for pg_tsvector keyword search
CREATE INDEX IF NOT EXISTS "document_chunks_content_fts_idx"
    ON "document_chunks" USING gin(to_tsvector('english', "content"));
