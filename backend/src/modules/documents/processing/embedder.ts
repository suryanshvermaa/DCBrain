import { pipeline, env } from '@xenova/transformers';
import { logger } from '@/lib/logger';
import config from '@/core/config';

// Ensure the models are downloaded locally and not fetched repeatedly if cached.
env.allowLocalModels = true;
// In production/docker, you'd likely mount a cache dir or bundle it.

let extractorPipeline: any = null;

export async function getExtractorPipeline() {
  if (!extractorPipeline) {
    logger.info(`Initializing embedding pipeline with model ${config.EMBEDDING_MODEL}...`);
    // Note: BAAI/bge-m3 is mapped to Xenova/bge-m3 in the transformers.js hub
    const modelName = config.EMBEDDING_MODEL === 'BAAI/bge-m3' ? 'Xenova/bge-m3' : (config.EMBEDDING_MODEL || 'Xenova/bge-m3');
    extractorPipeline = await pipeline('feature-extraction', modelName);
    logger.info('Embedding pipeline initialized');
  }
  return extractorPipeline;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  try {
    const extractor = await getExtractorPipeline();
    // Generate embeddings for the batch
    const output = await extractor(texts, { pooling: 'mean', normalize: true });
    // output is a Tensor, output.tolist() converts it to a JS array
    return output.tolist();
  } catch (error) {
    logger.error('Failed to generate embeddings', { error });
    throw new Error('Failed to generate embeddings');
  }
}
