// @ts-nocheck
import { Request, Response } from 'express';
import { ProcurementService } from './service';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { updateVendorSchema } from './schema';

export class ProcurementController {
  static async import(req: Request, res: Response) {
    try {
      const projectId = req.params['id'] as string;
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

      const { triggerAgentsOnEvent } = await import('@/modules/agents/triggers');
      const userId = (req as { auth?: { user: { id: string } } }).auth?.user.id;
      await triggerAgentsOnEvent('procurement_imported', projectId, userId, {
        importedCount: result.importedCount,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error importing procurement data:', error);
      return res.status(500).json({ error: 'Failed to import data', details: error.message });
    }
  }

  static async getItems(req: Request, res: Response) {
    try {
      const projectId = req.params['id'] as string;
      const items = await ProcurementService.getItems(projectId);
      return res.status(200).json({ items });
    } catch (error) {
      logger.error('Error fetching procurement items:', error);
      return res.status(500).json({ error: 'Failed to fetch items' });
    }
  }

  static async getVendors(req: Request, res: Response) {
    try {
      const projectId = req.params['id'] as string;
      const vendors = await ProcurementService.getVendors(projectId);
      return res.status(200).json({ vendors });
    } catch (error) {
      logger.error('Error fetching vendors:', error);
      return res.status(500).json({ error: 'Failed to fetch vendors' });
    }
  }

  static async updateVendor(req: Request, res: Response) {
    try {
      const projectId = req.params['id'] as string;
      const vendorId = req.params['vendorId'] as string;
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
      const projectId = req.params['id'] as string;
      const itemId = req.params['itemId'] as string;
      const alternatives = await ProcurementService.getAlternatives(projectId, itemId);
      return res.status(200).json(alternatives);
    } catch (error) {
      logger.error('Error fetching alternatives:', error);
      return res.status(500).json({ error: 'Failed to fetch alternatives' });
    }
  }
}
