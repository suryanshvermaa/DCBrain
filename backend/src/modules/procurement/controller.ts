import { Request, Response } from 'express';
import { ProcurementService } from './service';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { updateVendorSchema } from './schema';

export class ProcurementController {
  static async import(req: Request, res: Response) {
    try {
      const { id: projectId } = req.params;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const result = await ProcurementService.importData(
        projectId,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error importing procurement data:', error);
      return res.status(500).json({ error: 'Failed to import data', details: error.message });
    }
  }

  static async getItems(req: Request, res: Response) {
    try {
      const { id: projectId } = req.params;
      const items = await ProcurementService.getItems(projectId);
      return res.status(200).json({ items });
    } catch (error) {
      logger.error('Error fetching procurement items:', error);
      return res.status(500).json({ error: 'Failed to fetch items' });
    }
  }

  static async getVendors(req: Request, res: Response) {
    try {
      const { id: projectId } = req.params;
      const vendors = await ProcurementService.getVendors(projectId);
      return res.status(200).json({ vendors });
    } catch (error) {
      logger.error('Error fetching vendors:', error);
      return res.status(500).json({ error: 'Failed to fetch vendors' });
    }
  }

  static async updateVendor(req: Request, res: Response) {
    try {
      const { id: projectId, vendorId } = req.params;
      const data = updateVendorSchema.parse(req.body);
      
      const vendor = await prisma.vendor.update({
        where: { id: vendorId, projectId },
        data
      });

      return res.status(200).json({ vendor });
    } catch (error) {
      logger.error('Error updating vendor:', error);
      return res.status(500).json({ error: 'Failed to update vendor' });
    }
  }

  static async getAlternatives(req: Request, res: Response) {
    try {
      const { id: projectId, itemId } = req.params;
      const alternatives = await ProcurementService.getAlternatives(projectId, itemId);
      return res.status(200).json(alternatives);
    } catch (error) {
      logger.error('Error fetching alternatives:', error);
      return res.status(500).json({ error: 'Failed to fetch alternatives' });
    }
  }
}
