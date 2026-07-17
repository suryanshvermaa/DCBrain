import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import config from '@/core/config';

let openaiClient: OpenAI | null = null;

export function getEmbeddingClient(): OpenAI {
  if (!openaiClient) {
    logger.info(`Initializing embedding client with model ${config.EMBEDDING_MODEL}...`);
    openaiClient = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    logger.info('Embedding client initialized');
  }
  return openaiClient;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    const client = getEmbeddingClient();
    const response = await client.embeddings.create({
      model: config.EMBEDDING_MODEL,
      input: texts,
    });
    // Preserve input order by sorting on the returned index.
    return response.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  } catch (error) {
    logger.error('Failed to generate embeddings', { error });
    throw new Error('Failed to generate embeddings');
  }
}
