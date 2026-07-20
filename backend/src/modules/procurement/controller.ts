import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ProcurementService } from './service';
import { BadRequestError } from '@/core/errors';
import { type AuthenticatedRequest } from '@/modules/auth/middleware';
import { updateVendorSchema } from './schema';

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

export class ProcurementController {
  static async import(req: Request, res: Response) {
    const projectId = req.params['id'] as string;
    const actor = getActor(req);
    const file = req.file;

    if (!file) {
      throw new BadRequestError('No file uploaded');
    }

    const result = await ProcurementService.importData(
      projectId,
      actor,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const { triggerAgentsOnEvent } = await import('@/modules/agents/triggers');
    await triggerAgentsOnEvent('procurement_imported', projectId, actor.id, {
      importedCount: result.importedCount,
    });

    res.status(200).json(result);
  }

  static async getItems(req: Request, res: Response) {
    const projectId = req.params['id'] as string;
    const items = await ProcurementService.getItems(projectId, getActor(req));
    res.status(200).json({ items });
  }

  static async getVendors(req: Request, res: Response) {
    const projectId = req.params['id'] as string;
    const vendors = await ProcurementService.getVendors(projectId, getActor(req));
    res.status(200).json({ vendors });
  }

  static async updateVendor(req: Request, res: Response) {
    const projectId = req.params['id'] as string;
    const vendorId = req.params['vendorId'] as string;
    const data = updateVendorSchema.parse(req.body);

    const vendor = await ProcurementService.updateVendor(projectId, getActor(req), vendorId, data);
    res.status(200).json({ vendor });
  }

  static async getAlternatives(req: Request, res: Response) {
    const projectId = req.params['id'] as string;
    const itemId = req.params['itemId'] as string;
    const alternatives = await ProcurementService.getAlternatives(projectId, getActor(req), itemId);
    res.status(200).json(alternatives);
  }
}
