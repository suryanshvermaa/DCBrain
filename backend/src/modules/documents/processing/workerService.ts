import { DocumentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function updateDocumentProcessingStatus(
  documentId: string,
  status: DocumentStatus,
  step: string
): Promise<void> {
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status,
      metadata: {
        set: {
          processing: {
            step,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    },
  });
}
