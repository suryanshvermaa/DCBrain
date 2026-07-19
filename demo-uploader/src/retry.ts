/** Retry with exponential backoff. */

import type { Logger } from './logger.js';

export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  label: string;
  log: Logger;
  /** Called before each retry (e.g. capture screenshot). */
  onRetry?: (attempt: number, error: Error) => Promise<void>;
}

export async function withRetry<T>(fn: (attempt: number) => Promise<T>, opts: RetryOptions): Promise<T> {
  let lastError: Error = new Error('unknown');
  for (let attempt = 1; attempt <= opts.retries + 1; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt <= opts.retries) {
        const delay = opts.baseDelayMs * 2 ** (attempt - 1);
        opts.log.warn(`${opts.label} failed (attempt ${attempt}/${opts.retries + 1}): ${lastError.message}. Retrying in ${delay}ms`);
        if (opts.onRetry) await opts.onRetry(attempt, lastError);
        await sleep(delay);
      } else {
        opts.log.error(`${opts.label} failed after ${opts.retries + 1} attempts: ${lastError.message}`);
      }
    }
  }
  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
