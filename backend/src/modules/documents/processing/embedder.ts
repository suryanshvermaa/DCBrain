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

  // Use Gemini if OpenAI key is missing or a test/placeholder key, and Gemini API key is available
  if (
    config.GEMINI_API_KEY &&
    (!config.OPENAI_API_KEY ||
      config.OPENAI_API_KEY.includes('test') ||
      config.OPENAI_API_KEY.includes('YOUR_'))
  ) {
    try {
      const results: number[][] = [];
      for (const text of texts) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${config.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/gemini-embedding-001',
              content: { parts: [{ text }] },
            }),
          }
        );
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini embedding error: ${response.status} ${errText}`);
        }
        const data = await (response.json() as Promise<any>);
        if (data.embedding?.values) {
          results.push(data.embedding.values);
        } else {
          throw new Error('No embedding values returned from Gemini');
        }
      }
      return results;
    } catch (error) {
      logger.error('Failed to generate Gemini embeddings', { error });
      throw error;
    }
  }

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
