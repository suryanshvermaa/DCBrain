import { Router } from 'express';
import { ProcurementController } from './controller';
import multer from 'multer';

// Use memory storage for parsing directly
const upload = multer({ storage: multer.memoryStorage() });

export const procurementRouter = Router({ mergeParams: true });

procurementRouter.post('/import', upload.single('file'), ProcurementController.import);
procurementRouter.get('/', ProcurementController.getItems);
procurementRouter.get('/vendors', ProcurementController.getVendors);
procurementRouter.put('/vendors/:vendorId', ProcurementController.updateVendor);
procurementRouter.get('/alternatives/:itemId', ProcurementController.getAlternatives);
