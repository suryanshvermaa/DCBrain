-- CreateIndex
CREATE INDEX "change_orders_approvedById_idx" ON "change_orders"("approvedById");

-- CreateIndex
CREATE INDEX "change_orders_documentId_idx" ON "change_orders"("documentId");

-- CreateIndex
CREATE INDEX "change_orders_scheduleActivityId_idx" ON "change_orders"("scheduleActivityId");

-- CreateIndex
CREATE INDEX "commissioning_records_documentId_idx" ON "commissioning_records"("documentId");

-- CreateIndex
CREATE INDEX "inspections_vendorId_idx" ON "inspections"("vendorId");

-- CreateIndex
CREATE INDEX "inspections_documentId_idx" ON "inspections"("documentId");

-- CreateIndex
CREATE INDEX "ncrs_raisedById_idx" ON "ncrs"("raisedById");

-- CreateIndex
CREATE INDEX "ncrs_documentId_idx" ON "ncrs"("documentId");

-- CreateIndex
CREATE INDEX "ncrs_rfiId_idx" ON "ncrs"("rfiId");

-- CreateIndex
CREATE INDEX "ncrs_vendorId_idx" ON "ncrs"("vendorId");

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_rfiId_fkey" FOREIGN KEY ("rfiId") REFERENCES "rfis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissioning_records" ADD CONSTRAINT "commissioning_records_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_orders" ADD CONSTRAINT "change_orders_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_orders" ADD CONSTRAINT "change_orders_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_orders" ADD CONSTRAINT "change_orders_scheduleActivityId_fkey" FOREIGN KEY ("scheduleActivityId") REFERENCES "schedule_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
