-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetActivityId" TEXT NOT NULL,
    "delayDays" INTEGER NOT NULL,
    "assumptions" JSONB,
    "status" "SimulationStatus" NOT NULL DEFAULT 'PENDING',
    "impacts" JSONB,
    "mitigationPlans" JSONB,
    "costImpact" DOUBLE PRECISION,
    "timeImpactDays" INTEGER,
    "error" TEXT,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simulations_projectId_idx" ON "simulations"("projectId");

-- CreateIndex
CREATE INDEX "simulations_targetActivityId_idx" ON "simulations"("targetActivityId");

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
