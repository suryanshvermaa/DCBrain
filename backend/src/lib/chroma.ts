import type { Collection } from 'chromadb';
import { ChromaClient } from 'chromadb';
import config from '@/core/config';
import { logger } from '@/lib/logger';

const globalForChroma = globalThis as unknown as {
  chroma: ChromaClient | undefined;
};

export const chroma =
  globalForChroma.chroma ??
  new ChromaClient({
    path: `http://${config.CHROMA_HOST}:${config.CHROMA_PORT}`,
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForChroma.chroma = chroma;
}

export async function getOrCreateCollection(projectId: string): Promise<Collection> {
  const collectionName = `${config.CHROMA_COLLECTION_PREFIX}${projectId}`;
  try {
    // ChromaDB JS types require an embedding function even when one is not used.
    // @ts-expect-error embeddingFunction is not needed for manual embedding insertion
    return await chroma.getCollection({ name: collectionName });
  } catch {
    logger.info('Creating new ChromaDB collection', { collectionName, projectId });
    return await chroma.createCollection({
      name: collectionName,
      metadata: { projectId, createdAt: new Date().toISOString() },
    });
  }
}

export async function deleteCollection(projectId: string): Promise<void> {
  const collectionName = `${config.CHROMA_COLLECTION_PREFIX}${projectId}`;
  try {
    await chroma.deleteCollection({ name: collectionName });
    logger.info('Deleted ChromaDB collection', { collectionName });
  } catch (error) {
    logger.warn('Failed to delete ChromaDB collection', { collectionName, error });
  }
}

export async function checkChromaHealth(): Promise<boolean> {
  try {
    // The JS client's heartbeat() targets /api/v2/heartbeat, which is not
    // supported by the ChromaDB server version we run. Use the v1 endpoint.
    const response = await fetch(
      `http://${config.CHROMA_HOST}:${config.CHROMA_PORT}/api/v1/heartbeat`
    );
    return response.ok;
  } catch {
    return false;
  }
}

export default chroma;
