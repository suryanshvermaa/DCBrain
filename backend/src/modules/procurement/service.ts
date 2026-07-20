import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';
import { logger } from '@/lib/logger';
import { minio } from '@/lib/minio';
import config from '@/core/config';
import crypto from 'crypto';
import type { Role } from '@prisma/client';
import { assertProjectAccess } from '@/modules/projects';
import { NotFoundError } from '@/core/errors';

export interface ProcurementActor {
  id: string;
  role: Role;
}

export class ProcurementService {
  /**
   * Import procurement data from an Excel/CSV file Buffer.
   */
  static async importData(
    projectId: string,
    actor: ProcurementActor,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
  ) {
    await assertProjectAccess(projectId, actor);

    // 1. Upload raw file to MinIO for auditing
    const objectName = `procurement/${projectId}/${crypto.randomUUID()}-${filename}`;
    await minio.putObject(
      config.MINIO_BUCKET_NAME,
      objectName,
      fileBuffer,
      fileBuffer.length,
      { 'Content-Type': mimeType }
    );

    // 2. Parse file
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('No sheets found in the uploaded file');
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error('No sheet found in the uploaded file');
    // We expect headers like: PO Number, Line Item, Vendor, Material, Quantity, Unit, Status, Order Date, Promised Date, Required On Site Date, Actual Delivery Date
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: null }) as any[];

    let importedCount = 0;
    for (const row of rawData) {
      const material = row['Material'] || row['material'] || row['Material Description'] || row['Material Code'] || row['description'] || row['equipment_id'];
      if (!material) continue; // Skip empty rows

      const vendorName = (row['Vendor'] || row['vendor'] || 'Unknown Vendor').toString().trim();

      // Upsert vendor
      const vendor = await prisma.vendor.findFirst({
        where: { projectId, name: vendorName }
      });

      let vendorId = vendor?.id;
      if (!vendor) {
        const newVendor = await prisma.vendor.create({
          data: {
            projectId,
            name: vendorName,
          }
        });
        vendorId = newVendor.id;
      }

      // Map status
      let rawStatus = (row['Status'] || row['status'] || row['Delivery Status'] || 'IDENTIFIED').toString().toUpperCase().replace(/ /g, '_');
      if (rawStatus === 'DELIVERED') rawStatus = 'RECEIVED';
      const validStatuses = ['IDENTIFIED', 'RFQ', 'PO_ISSUED', 'IN_FABRICATION', 'SHIPPED', 'RECEIVED', 'INSTALLED'];
      const status = validStatuses.includes(rawStatus) ? rawStatus : 'IDENTIFIED';

      // Parse Dates safely
      const parseExcelDate = (val: any) => {
        if (!val) return null;
        if (val instanceof Date) return val;
        if (typeof val === 'number') {
          // Excel date serial number
          return new Date((val - (25567 + 2)) * 86400 * 1000); // Unix timestamp
        }
        const parsed = new Date(val);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      await prisma.procurementItem.create({
        data: {
          projectId,
          vendorId,
          poNumber: row['PO Number']?.toString() || row['po_number']?.toString() || row['po_ref']?.toString() || row['po_no']?.toString() || null,
          lineItem: row['Line Item']?.toString() || row['line_item']?.toString() || row['item_no']?.toString() || null,
          material: material.toString(),
          quantity: parseFloat(row['Quantity']?.toString() || row['quantity']?.toString() || row['qty']?.toString() || '0'),
          unit: row['Unit']?.toString() || row['unit']?.toString() || null,
          status: status as any,
          orderDate: parseExcelDate(row['Order Date'] || row['order_date'] || row['PO Date']),
          promisedDate: parseExcelDate(row['Promised Date'] || row['promised_date'] || row['Promised Delivery']),
          requiredOnSiteDate: parseExcelDate(row['Required On Site Date'] || row['required_on_site_date'] || row['Required Date']),
          actualDeliveryDate: parseExcelDate(row['Actual Delivery Date'] || row['actual_delivery_date'] || row['Actual Delivery']),
        }
      });
      importedCount++;
    }

    // New procurement data can change search results — clear stale cached answers.
    try {
      const { invalidateProjectSearchCache } = await import('@/modules/rag/pipeline');
      await invalidateProjectSearchCache(projectId);
    } catch (cacheErr) {
      logger.warn('Failed to invalidate search cache after procurement import', { projectId, error: cacheErr });
    }

    return { importedCount };
  }

  /**
   * Get all procurement items for a project
   */
  static async getItems(projectId: string, actor: ProcurementActor) {
    await assertProjectAccess(projectId, actor);
    return prisma.procurementItem.findMany({
      where: { projectId },
      include: { vendor: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get all vendors and compute their scorecard.
   * Read-only: scores are computed for the response, not persisted here
   * (persistence happens on the import path / a batched job).
   */
  static async getVendors(projectId: string, actor: ProcurementActor) {
    await assertProjectAccess(projectId, actor);
    const vendors = await prisma.vendor.findMany({
      where: { projectId },
      include: { items: true }
    });

    // Recalculate score (onTimeDelivery 40%, quality 30%, compliance 30%)
    return vendors.map((vendor) => {
      let onTimeCount = 0;
      let deliveredCount = 0;

      for (const item of vendor.items) {
        if (item.actualDeliveryDate && item.promisedDate) {
          deliveredCount++;
          if (item.actualDeliveryDate <= item.promisedDate) {
            onTimeCount++;
          }
        }
      }

      const onTimeDeliveryRate = deliveredCount > 0 ? (onTimeCount / deliveredCount) * 100 : vendor.onTimeDeliveryRate;
      const overallScore = (onTimeDeliveryRate * 0.4) + (vendor.qualityRate * 0.3) + (vendor.complianceRate * 0.3);

      return { ...vendor, onTimeDeliveryRate, overallScore };
    });
  }

  /**
   * Update a vendor's scorecard fields (tenant-scoped).
   */
  static async updateVendor(
    projectId: string,
    actor: ProcurementActor,
    vendorId: string,
    data: Record<string, unknown>
  ) {
    await assertProjectAccess(projectId, actor);
    const existing = await prisma.vendor.findFirst({ where: { id: vendorId, projectId } });
    if (!existing) throw new NotFoundError('Vendor', vendorId);

    return prisma.vendor.update({
      where: { id: vendorId },
      data,
    });
  }

  /**
   * Suggest alternatives
   */
  static async getAlternatives(projectId: string, actor: ProcurementActor, itemId: string) {
    await assertProjectAccess(projectId, actor);
    const item = await prisma.procurementItem.findFirst({
      where: { id: itemId, projectId },
      include: { vendor: true }
    });

    if (!item) throw new NotFoundError('Procurement item', itemId);

    // In a real app, this would query embeddings and ask Gemini.
    // For now, we simulate this by querying vendors who provide similar materials
    // or just all vendors and returning a simulated AI response.

    const otherVendors = await prisma.vendor.findMany({
      where: { projectId, id: { not: item.vendorId || '' } },
      take: 3,
      orderBy: { overallScore: 'desc' }
    });

    return {
      itemId,
      material: item.material,
      currentVendor: item.vendor,
      suggestions: otherVendors.map(v => ({
        vendorId: v.id,
        vendorName: v.name,
        score: v.overallScore,
        rationale: `Vendor has an overall score of ${v.overallScore.toFixed(1)}/100 and a strong track record for timely deliveries.`
      }))
    };
  }
}
