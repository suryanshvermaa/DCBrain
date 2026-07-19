/**
 * Schedule Risk import page object.
 *
 * Mirrors frontend/src/app/schedule/page.tsx:
 *   - header "Import XML" button triggers a hidden <input type="file" accept=".xml">
 *   - on success a green banner appears: "Import complete — N activities processed."
 *   - "Import History" section lists imported filenames with activity counts
 */

import type { Page } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';
import { RateLimitHit, isRateLimit, retryAfterToMs } from '../rateLimit.js';

export class SchedulePage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private url(): string {
    return new URL('/schedule', this.config.baseUrl).toString();
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url(), { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('button:has-text("Import XML"), button:has-text("Select File")', {
      timeout: this.config.timeoutMs,
    });
  }

  /**
   * Import a single P6 XML file. Returns the parsed activity count from the
   * success banner. Throws on the error banner.
   */
  async importFile(absPath: string): Promise<{ activityCount: number }> {
    const responsePromise = this.page
      .waitForResponse(
        (r) => r.url().includes('/schedule/import') && r.request().method() === 'POST',
        { timeout: this.config.processingTimeoutMs },
      )
      .catch(() => null);

    const fileInput = this.page.locator('input[type="file"][accept*="xml"], input[type="file"]').first();
    await fileInput.setInputFiles(absPath);

    const response = await responsePromise;
    if (response) {
      const status = response.status();
      if (status === 429 || isRateLimit(status)) {
        const retryAfter = retryAfterToMs(response.headers()['retry-after'], Date.now());
        throw new RateLimitHit(`Schedule import returned ${status} (rate limited)`, retryAfter);
      }
      if (status >= 400) {
        const bodyText = await response.text().catch(() => '');
        if (isRateLimit(bodyText)) throw new RateLimitHit(`Schedule import rate limited: ${bodyText.slice(0, 200)}`);
        throw new Error(`Schedule import failed with HTTP ${status}: ${bodyText.slice(0, 200)}`);
      }
    }

    // Wait for success or error banner.
    const success = this.page.locator('text=/Import complete —/');
    const error = this.page.locator('[class*="danger"]');

    const outcome = await Promise.race([
      success.first().waitFor({ state: 'visible', timeout: this.config.processingTimeoutMs }).then(() => 'success' as const),
      error.first().waitFor({ state: 'visible', timeout: this.config.processingTimeoutMs }).then(() => 'error' as const),
    ]).catch(() => 'timeout' as const);

    if (outcome === 'error') {
      const text = (await error.first().innerText()).trim();
      throw new Error(`Schedule import error: ${text}`);
    }
    if (outcome === 'timeout') {
      throw new Error('Schedule import timed out (no success or error banner).');
    }

    const banner = (await success.first().innerText()).trim();
    const m = banner.match(/(\d+)\s+activities/);
    const activityCount = m ? Number(m[1]) : 0;
    return { activityCount };
  }

  /**
   * Checks if a file with the given name is listed in the Import History section.
   */
  async hasImportHistory(filename: string): Promise<boolean> {
    const historySection = this.page.locator('h2:has-text("Import History")').locator('..');
    if (!(await historySection.count())) return false;
    
    // In the UI, the filename is displayed in a paragraph inside the history card.
    const fileLocator = historySection.locator(`text=${filename}`);
    return (await fileLocator.count()) > 0;
  }
}
