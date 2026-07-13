-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('IDENTIFIED', 'RFQ', 'PO_ISSUED', 'IN_FABRICATION', 'SHIPPED', 'RECEIVED', 'INSTALLED');

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "onTimeDeliveryRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "qualityRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "complianceRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_items" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT,
    "lineItem" TEXT,
    "material" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "status" "ProcurementStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "orderDate" TIMESTAMP(3),
    "promisedDate" TIMESTAMP(3),
    "requiredOnSiteDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "metadata" JSONB,
    "vendorId" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendors_projectId_idx" ON "vendors"("projectId");

-- CreateIndex
CREATE INDEX "procurement_items_projectId_idx" ON "procurement_items"("projectId");

-- CreateIndex
CREATE INDEX "procurement_items_vendorId_idx" ON "procurement_items"("vendorId");

-- CreateIndex
CREATE INDEX "procurement_items_status_idx" ON "procurement_items"("status");

-- CreateIndex
CREATE INDEX "procurement_items_requiredOnSiteDate_idx" ON "procurement_items"("requiredOnSiteDate");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_items" ADD CONSTRAINT "procurement_items_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_items" ADD CONSTRAINT "procurement_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
