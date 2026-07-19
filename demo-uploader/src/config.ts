/**
 * Resolves the effective configuration by layering, in increasing precedence:
 *   1. defaults from upload.config.ts
 *   2. environment variables (DCBRAIN_*)
 *   3. CLI flags (parsed in cli.ts and passed here)
 */

import baseConfig, { type UploadConfig } from '../upload.config.js';
import type { ModuleName } from './types.js';

export interface CliOverrides {
  baseUrl?: string;
  email?: string;
  password?: string;
  project?: string;
  browser?: UploadConfig['browser'];
  headless?: boolean;
  concurrency?: number;
  retryCount?: number;
  timeoutMs?: number;
  datasetRoot?: string;
  modules?: ModuleName[];
  /** Override the inter-upload delay (ms). */
  uploadDelayMs?: number;
  /** Toggle indexing verification for documents. */
  verifyIndexing?: boolean;
  /** Override the per-file indexing wait timeout (ms). */
  indexingTimeoutMs?: number;
}

function envBool(name: string): boolean | undefined {
  const v = process.env[name];
  if (v === undefined) return undefined;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

function envNum(name: string): number | undefined {
  const v = process.env[name];
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function resolveConfig(overrides: CliOverrides = {}): UploadConfig {
  const cfg: UploadConfig = structuredClone(baseConfig);

  // --- environment layer ---
  cfg.baseUrl = process.env.DCBRAIN_BASE_URL ?? cfg.baseUrl;
  cfg.credentials.email = process.env.DCBRAIN_EMAIL ?? cfg.credentials.email;
  cfg.credentials.password = process.env.DCBRAIN_PASSWORD ?? cfg.credentials.password;
  cfg.project.name = process.env.DCBRAIN_PROJECT ?? cfg.project.name;
  cfg.project.code = process.env.DCBRAIN_PROJECT_CODE ?? cfg.project.code;
  cfg.datasetRoot = process.env.DCBRAIN_DATASET_ROOT ?? cfg.datasetRoot;
  cfg.headless = envBool('DCBRAIN_HEADLESS') ?? cfg.headless;
  cfg.concurrency = envNum('DCBRAIN_CONCURRENCY') ?? cfg.concurrency;
  cfg.retryCount = envNum('DCBRAIN_RETRY') ?? cfg.retryCount;
  cfg.timeoutMs = envNum('DCBRAIN_TIMEOUT_MS') ?? cfg.timeoutMs;
  cfg.uploadDelayMs = envNum('DCBRAIN_DELAY_MS') ?? cfg.uploadDelayMs;
  cfg.indexingTimeoutMs = envNum('DCBRAIN_INDEXING_TIMEOUT_MS') ?? cfg.indexingTimeoutMs;
  cfg.verifyIndexing = envBool('DCBRAIN_VERIFY_INDEXING') ?? cfg.verifyIndexing;
  cfg.rateLimit.cooldownMs = envNum('DCBRAIN_RATE_COOLDOWN_MS') ?? cfg.rateLimit.cooldownMs;
  cfg.rateLimit.maxRetries = envNum('DCBRAIN_RATE_MAX_RETRIES') ?? cfg.rateLimit.maxRetries;
  if (process.env.DCBRAIN_BROWSER) cfg.browser = process.env.DCBRAIN_BROWSER as UploadConfig['browser'];

  // --- CLI layer (highest precedence) ---
  if (overrides.baseUrl) cfg.baseUrl = overrides.baseUrl;
  if (overrides.email) cfg.credentials.email = overrides.email;
  if (overrides.password) cfg.credentials.password = overrides.password;
  if (overrides.project) cfg.project.name = overrides.project;
  if (overrides.browser) cfg.browser = overrides.browser;
  if (overrides.headless !== undefined) cfg.headless = overrides.headless;
  if (overrides.concurrency !== undefined) cfg.concurrency = overrides.concurrency;
  if (overrides.retryCount !== undefined) cfg.retryCount = overrides.retryCount;
  if (overrides.timeoutMs !== undefined) cfg.timeoutMs = overrides.timeoutMs;
  if (overrides.datasetRoot) cfg.datasetRoot = overrides.datasetRoot;
  if (overrides.modules && overrides.modules.length) cfg.modules = overrides.modules;
  if (overrides.uploadDelayMs !== undefined) cfg.uploadDelayMs = overrides.uploadDelayMs;
  if (overrides.verifyIndexing !== undefined) cfg.verifyIndexing = overrides.verifyIndexing;
  if (overrides.indexingTimeoutMs !== undefined) cfg.indexingTimeoutMs = overrides.indexingTimeoutMs;

  return cfg;
}

export type { UploadConfig };
