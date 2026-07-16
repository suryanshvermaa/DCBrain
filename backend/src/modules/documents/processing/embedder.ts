import { logger } from '@/lib/logger';
import config from '@/core/config';

let extractorPipeline: any = null;
let transformersEnv: any = null;

export async function getExtractorPipeline() {
  if (!extractorPipeline) {
    const transformers = await import('@xenova/transformers');
    const pipeline = transformers.pipeline;
    transformersEnv = transformers.env;
    transformersEnv.allowLocalModels = true;

    logger.info(`Initializing embedding pipeline with model ${config.EMBEDDING_MODEL}...`);
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
