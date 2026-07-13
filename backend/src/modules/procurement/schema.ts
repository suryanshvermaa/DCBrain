import { z } from 'zod';

export const importProcurementSchema = z.object({
  // Multipart form data handles the file upload. 
  // No body needed to validate in JSON, but we can accept metadata.
});

export const updateVendorSchema = z.object({
  onTimeDeliveryRate: z.number().min(0).max(100).optional(),
  qualityRate: z.number().min(0).max(100).optional(),
  complianceRate: z.number().min(0).max(100).optional(),
  overallScore: z.number().min(0).max(100).optional(),
});
