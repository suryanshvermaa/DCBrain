-- CreateEnum
CREATE TYPE "NcrSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NcrStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED', 'VOID');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'ON_HOLD', 'WAIVED');

-- CreateEnum
CREATE TYPE "CommissioningStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ChangeOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ncrs" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "NcrSeverity" NOT NULL DEFAULT 'MINOR',
    "status" "NcrStatus" NOT NULL DEFAULT 'OPEN',
    "discipline" TEXT,
    "rootCause" TEXT,
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "projectId" TEXT NOT NULL,
    "raisedById" TEXT,
    "documentId" TEXT,
    "rfiId" TEXT,
    "vendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ncrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "itpRef" TEXT,
    "title" TEXT NOT NULL,
    "discipline" TEXT,
    "holdPoint" BOOLEAN NOT NULL DEFAULT false,
    "inspector" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "result" TEXT,
    "vendorId" TEXT,
    "documentId" TEXT,
    "metadata" JSONB,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissioning_records" (
    "id" TEXT NOT NULL,
    "testRef" TEXT,
    "systemName" TEXT NOT NULL,
    "discipline" TEXT,
    "status" "CommissioningStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "procedure" TEXT,
    "result" TEXT,
    "testedBy" TEXT,
    "completedDate" TIMESTAMP(3),
    "documentId" TEXT,
    "metadata" JSONB,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissioning_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_orders" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT,
    "costImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scheduleImpactDays" INTEGER NOT NULL DEFAULT 0,
    "status" "ChangeOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "documentId" TEXT,
    "scheduleActivityId" TEXT,
    "metadata" JSONB,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "change_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ncrs_projectId_idx" ON "ncrs"("projectId");

-- CreateIndex
CREATE INDEX "ncrs_severity_idx" ON "ncrs"("severity");

-- CreateIndex
CREATE INDEX "ncrs_status_idx" ON "ncrs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ncrs_projectId_number_key" ON "ncrs"("projectId", "number");

-- CreateIndex
CREATE INDEX "inspections_projectId_idx" ON "inspections"("projectId");

-- CreateIndex
CREATE INDEX "inspections_status_idx" ON "inspections"("status");

-- CreateIndex
CREATE INDEX "inspections_scheduledDate_idx" ON "inspections"("scheduledDate");

-- CreateIndex
CREATE INDEX "commissioning_records_projectId_idx" ON "commissioning_records"("projectId");

-- CreateIndex
CREATE INDEX "commissioning_records_status_idx" ON "commissioning_records"("status");

-- CreateIndex
CREATE INDEX "change_orders_projectId_idx" ON "change_orders"("projectId");

-- CreateIndex
CREATE INDEX "change_orders_status_idx" ON "change_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "change_orders_projectId_number_key" ON "change_orders"("projectId", "number");

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissioning_records" ADD CONSTRAINT "commissioning_records_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_orders" ADD CONSTRAINT "change_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
