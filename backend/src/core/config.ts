import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Application
  APP_NAME: z.string().default('DCBrain'),
  APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  APP_DEBUG: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  APP_VERSION: z.string().default('0.1.0'),
  APP_HOST: z.string().default('0.0.0.0'),
  APP_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('8000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Authentication
  JWT_SECRET_KEY: z.string().min(32, 'JWT_SECRET_KEY must be at least 32 characters'),
  JWT_ALGORITHM: z.enum(['HS256', 'RS256']).default('HS256'),
  JWT_ACCESS_TOKEN_EXPIRE_MINUTES: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('1440'),
  JWT_REFRESH_TOKEN_EXPIRE_DAYS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('7'),

  // Database
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  DATABASE_POOL_SIZE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('20'),
  DATABASE_MAX_OVERFLOW: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('10'),
  DATABASE_ECHO: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Redis
  REDIS_URL: z.string().url().startsWith('redis://'),

  // Object Storage (MinIO)
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('9000'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_USE_SSL: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  MINIO_BUCKET_NAME: z.string().default('dcbrain-documents'),

  // Graph Database (Neo4j)
  GRAPH_DB_URL: z.string().url().startsWith('bolt://'),
  GRAPH_DB_USER: z.string().default('neo4j'),
  GRAPH_DB_PASSWORD: z.string().default('password'),

  // ChromaDB
  CHROMA_HOST: z.string().default('localhost'),
  CHROMA_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('8100'),
  CHROMA_COLLECTION_PREFIX: z.string().default('project_'),

  // Gemini & Embeddings
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  EMBEDDING_MODEL: z.string().default('BAAI/bge-m3'),
  GEMINI_MAX_TOKENS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('2000'),
  GEMINI_TEMPERATURE: z
    .string()
    .transform((val) => parseFloat(val))
    .default('0.1'),

  // Document Processing
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_SIZE_MB: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('100'),
  CHUNK_SIZE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('512'),
  CHUNK_OVERLAP: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('50'),
  EMBEDDING_BATCH_SIZE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('100'),

  // BullMQ
  BULLMQ_BROKER_URL: z.string().url().startsWith('redis://').default('redis://localhost:6379/1'),
  BULLMQ_RESULT_BACKEND: z
    .string()
    .url()
    .startsWith('redis://')
    .default('redis://localhost:6379/2'),
  BULLMQ_WORKER_CONCURRENCY: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('2'),

  // Logging
  LOG_LEVEL: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).default('INFO'),
  LOG_FORMAT: z.enum(['json', 'console']).default('console'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let configCache: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (configCache) {
    return configCache;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  configCache = result.data;
  return configCache;
}

export function resetConfigCache(): void {
  configCache = null;
}

const config = getConfig();
export default config;
