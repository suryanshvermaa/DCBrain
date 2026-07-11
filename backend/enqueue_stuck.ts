import { PrismaClient } from '@prisma/client';
import { enqueueDocumentProcessing } from './src/modules/documents/processing/queue';
import { connectRedis } from './src/lib/redis';

const prisma = new PrismaClient();

async function main() {
  await connectRedis();
  const stuckDocs = await prisma.document.findMany({ 
    where: { 
      status: { in: ['QUEUED', 'PROCESSING', 'FAILED', 'PROCESSED'] } 
    } 
  });
  
  if (stuckDocs.length === 0) {
    console.log('No stuck documents found.');
    return;
  }
  
  for (const doc of stuckDocs) {
    console.log('Re-enqueueing document:', doc.id);
    await enqueueDocumentProcessing({
      documentId: doc.id,
      projectId: doc.projectId,
      filename: doc.filename,
      mimeType: doc.mimeType,
      bucket: doc.bucket,
      path: doc.path,
      ownerId: doc.ownerId,
    });
  }
  console.log('Successfully pushed all stuck documents to the processing queue.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
