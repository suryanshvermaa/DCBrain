import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requirePermission } from '@/modules/auth/middleware';
import { ProcurementController } from './controller';

// Use memory storage for parsing directly
const upload = multer({ storage: multer.memoryStorage() });

export const procurementRouter = Router({ mergeParams: true });

procurementRouter.use(requireAuth);

procurementRouter.post(
  '/import',
  requirePermission('import_procurement_data'),
  upload.single('file'),
  asyncHandler(ProcurementController.import)
);
procurementRouter.get(
  '/',
  requirePermission('view_dashboard'),
  asyncHandler(ProcurementController.getItems)
);
procurementRouter.get(
  '/vendors',
  requirePermission('view_dashboard'),
  asyncHandler(ProcurementController.getVendors)
);
procurementRouter.put(
  '/vendors/:vendorId',
  requirePermission('import_procurement_data'),
  asyncHandler(ProcurementController.updateVendor)
);
procurementRouter.get(
  '/alternatives/:itemId',
  requirePermission('view_dashboard'),
  asyncHandler(ProcurementController.getAlternatives)
);
