-- CreateEnum
CREATE TYPE "RfiStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ANSWERED', 'CLOSED', 'VOID');

-- CreateEnum
CREATE TYPE "RfiPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "rfis" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" "RfiStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "RfiPriority" NOT NULL DEFAULT 'MEDIUM',
    "discipline" TEXT,
    "dueDate" TIMESTAMP(3),
    "resolution" TEXT,
    "suggestedAnswer" TEXT,
    "suggestedSources" JSONB,
    "suggestedAt" TIMESTAMP(3),
    "answeredAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "projectId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "assigneeId" TEXT,
    "answeredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfi_documents" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rfiId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "rfi_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rfis_projectId_idx" ON "rfis"("projectId");

-- CreateIndex
CREATE INDEX "rfis_status_idx" ON "rfis"("status");

-- CreateIndex
CREATE INDEX "rfis_dueDate_idx" ON "rfis"("dueDate");

-- CreateIndex
CREATE INDEX "rfis_assigneeId_idx" ON "rfis"("assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "rfis_projectId_number_key" ON "rfis"("projectId", "number");

-- CreateIndex
CREATE INDEX "rfi_documents_rfiId_idx" ON "rfi_documents"("rfiId");

-- CreateIndex
CREATE INDEX "rfi_documents_documentId_idx" ON "rfi_documents"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "rfi_documents_rfiId_documentId_key" ON "rfi_documents"("rfiId", "documentId");

-- AddForeignKey
ALTER TABLE "rfis" ADD CONSTRAINT "rfis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfis" ADD CONSTRAINT "rfis_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfis" ADD CONSTRAINT "rfis_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfis" ADD CONSTRAINT "rfis_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfi_documents" ADD CONSTRAINT "rfi_documents_rfiId_fkey" FOREIGN KEY ("rfiId") REFERENCES "rfis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfi_documents" ADD CONSTRAINT "rfi_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
