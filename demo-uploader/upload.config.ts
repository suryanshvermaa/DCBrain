/**
 * DCBrain Demo-Data Uploader — configuration.
 *
 * No values are hard-coded in the automation logic; everything the operator
 * may need to change lives here (and can be overridden per-run via environment
 * variables or CLI flags — see `src/cli.ts` and `src/config.ts`).
 *
 * Precedence (lowest → highest): defaults in this file → environment variables
 * → CLI flags.
 */

import type { ModuleName } from './src/types.js';

export interface UploadConfig {
  /** Base URL of the running DCBrain frontend (Next.js). */
  baseUrl: string;
  /** Login credentials of a user with upload permissions. */
  credentials: {
    email: string;
    password: string;
  };
  /** Target project. If it does not exist it is created (unless createProjectIfMissing=false). */
  project: {
    name: string;
    /** Project code (2–40 chars). Only used when the project must be created. */
    code: string;
    location?: string;
    description?: string;
    createIfMissing: boolean;
  };
  /** Absolute or relative (to repo root) path of the dataset to scan. */
  datasetRoot: string;
  /** Browser engine. */
  browser: 'chromium' | 'firefox' | 'webkit';
  /** Run without a visible browser window. */
  headless: boolean;
  /** Slow down each Playwright action by N ms (useful for demos / debugging). */
  slowMoMs: number;
  /** How many files to select per Documents upload batch (backend hard-limit is 50). */
  documentsBatchSize: number;
  /** Retry attempts per upload unit (batch or single import) before giving up. */
  retryCount: number;
  /** Base delay (ms) between retries; grows exponentially. */
  retryBackoffMs: number;
  /** Generic navigation / action timeout (ms). */
  timeoutMs: number;
  /** Max time to wait for a document batch to finish server-side processing (ms). */
  processingTimeoutMs: number;
  /** Verify that each uploaded document reaches PROCESSED (indexed) before continuing. */
  verifyIndexing: boolean;
  /** Max time to wait for a single document to reach PROCESSED/FAILED in the UI (ms). */
  indexingTimeoutMs: number;
  /** How often to poll the UI while waiting for indexing (ms). */
  indexingPollMs: number;
  /** Idle delay between successive upload units (ms) — keeps the demo readable and the server calm. */
  uploadDelayMs: number;
  /** Rate-limit safety policy (429 / "Too Many Requests" / auth lockout handling). */
  rateLimit: {
    /** Base cooldown (ms) to wait after a rate-limit signal before retrying. Grows per attempt. */
    cooldownMs: number;
    /** How many cooldown+retry cycles to attempt before aborting the whole run. */
    maxRetries: number;
    /** Cap on any single cooldown (ms), even if Retry-After asks for longer. */
    maxCooldownMs: number;
  };
  /**
   * Number of upload units processed concurrently. Kept at 1 by default: the UI
   * is single-project/single-session and concurrent uploads race the same
   * document list. Raise only if you understand the trade-offs.
   */
  concurrency: number;
  /** Which modules to process. Order is respected. */
  modules: ModuleName[];
  /** Directory (relative to demo-uploader/) for logs, screenshots, videos, progress + reports. */
  artifactsDir: string;
  /** Capture a full-page screenshot whenever an upload unit fails. */
  screenshotOnFailure: boolean;
  /** Record a video of the whole run. */
  video: boolean;
}

const config: UploadConfig = {
  baseUrl: 'https://dcbrain.nebula-hack.tech/',
  credentials: {
    email: 'suryansh@gmail.com',
    password: 'testadminpassword',
  },
  project: {
    name: 'Orion Data Centre Phase 1',
    code: 'ORION-DC-P1',
    location: 'Bengaluru, Karnataka, India',
    description: 'Tier III Data Centre — EPC demo dataset (auto-uploaded).',
    createIfMissing: true,
  },
  datasetRoot: '../project-data',
  browser: 'chromium',
  headless: false,
  slowMoMs: 0,
  documentsBatchSize: 25,
  retryCount: 3,
  retryBackoffMs: 2000,
  timeoutMs: 30_000,
  processingTimeoutMs: 180_000,
  verifyIndexing: true,
  indexingTimeoutMs: 180_000,
  indexingPollMs: 3_000,
  uploadDelayMs: 750,
  rateLimit: {
    cooldownMs: 30_000,
    maxRetries: 5,
    maxCooldownMs: 120_000,
  },
  concurrency: 1,
  modules: ['Documents', 'Procurement', 'Schedule Risk'],
  artifactsDir: '.artifacts',
  screenshotOnFailure: true,
  video: true,
};

export default config;
