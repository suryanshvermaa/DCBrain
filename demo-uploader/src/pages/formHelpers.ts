/**
 * Shared helpers for the "create a record" page objects.
 *
 * These keep the per-module page objects small: they all watch the create POST
 * to distinguish a genuine success from a 429 rate-limit or other server error,
 * exactly like the upload page objects (DocumentsPage / ProcurementPage / …).
 */

import type { Page, Response } from 'playwright';
import { RateLimitHit, isRateLimit, retryAfterToMs } from '../rateLimit.js';

/**
 * Start watching for the create POST whose URL contains `urlPart`.
 * Returns a promise that resolves to the Response (or null if it never fires).
 * Attach this BEFORE clicking the submit button, then await it after.
 */
export function watchCreate(page: Page, urlPart: string, timeoutMs: number): Promise<Response | null> {
  return page
    .waitForResponse(
      (r: Response) => r.url().includes(urlPart) && r.request().method() === 'POST',
      { timeout: timeoutMs },
    )
    .catch(() => null);
}

/**
 * Inspect a create POST response and throw on failure:
 *   - 429 / rate-limit signal → RateLimitHit (so the seeder cools down & retries)
 *   - any other >= 400        → Error (so the seeder records a failure)
 * A 2xx/3xx (or a missing response) is treated as acceptable.
 */
export async function assertCreateOk(response: Response | null, label: string): Promise<void> {
  if (!response) return;
  const status = response.status();
  if (status === 429 || isRateLimit(status)) {
    const retryAfter = retryAfterToMs(response.headers()['retry-after'], Date.now());
    throw new RateLimitHit(`${label} returned ${status} (rate limited)`, retryAfter);
  }
  if (status >= 400) {
    const bodyText = await response.text().catch(() => '');
    if (isRateLimit(bodyText)) throw new RateLimitHit(`${label} rate limited: ${bodyText.slice(0, 200)}`);
    throw new Error(`${label} failed with HTTP ${status}: ${bodyText.slice(0, 200)}`);
  }
}
