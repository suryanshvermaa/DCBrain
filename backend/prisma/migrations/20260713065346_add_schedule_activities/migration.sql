-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ScheduleImportStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "schedule_activities" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wbsCode" TEXT,
    "wbsName" TEXT,
    "plannedStart" TIMESTAMP(3),
    "plannedFinish" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualFinish" TIMESTAMP(3),
    "durationDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFloat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeFloat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "predecessors" JSONB,
    "resourceAssignments" JSONB,
    "mitigationActions" JSONB,
    "importId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_imports" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "activityCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ScheduleImportStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "projectId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_activities_projectId_idx" ON "schedule_activities"("projectId");

-- CreateIndex
CREATE INDEX "schedule_activities_importId_idx" ON "schedule_activities"("importId");

-- CreateIndex
CREATE INDEX "schedule_activities_isCritical_idx" ON "schedule_activities"("isCritical");

-- CreateIndex
CREATE INDEX "schedule_activities_riskLevel_idx" ON "schedule_activities"("riskLevel");

-- CreateIndex
CREATE INDEX "schedule_activities_riskScore_idx" ON "schedule_activities"("riskScore");

-- CreateIndex
CREATE INDEX "schedule_imports_projectId_idx" ON "schedule_imports"("projectId");

-- CreateIndex
CREATE INDEX "schedule_imports_importedAt_idx" ON "schedule_imports"("importedAt");

-- AddForeignKey
ALTER TABLE "schedule_activities" ADD CONSTRAINT "schedule_activities_importId_fkey" FOREIGN KEY ("importId") REFERENCES "schedule_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_activities" ADD CONSTRAINT "schedule_activities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_imports" ADD CONSTRAINT "schedule_imports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
