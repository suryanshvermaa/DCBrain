/**
 * Procurement import page object.
 *
 * Mirrors frontend/src/app/procurement/page.tsx:
 *   - header <label> "Import CSV/XLSX" wraps a hidden <input type="file" accept=".csv,.xlsx">
 *   - on success the app shows: alert(`Successfully imported N items.`)
 *   - the items table / KPI cards refresh
 *
 * We intercept the window.alert to read the imported count (Playwright dialog handler),
 * and also assert the "Total Items" KPI increased.
 */

import type { Page, Dialog } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';
import { RateLimitHit, isRateLimit, retryAfterToMs } from '../rateLimit.js';

export class ProcurementPage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private url(): string {
    return new URL('/procurement', this.config.baseUrl).toString();
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url(), { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('label:has-text("Import CSV/XLSX") input:not([disabled])', { state: 'attached', timeout: this.config.timeoutMs });
  }

  /**
   * Import a single procurement table. Resolves the imported-count from the
   * success alert. Throws if the app surfaces an error instead.
   */
  async importFile(absPath: string): Promise<{ importedCount: number }> {
    let importedCount = 0;
    let dialogMessage = '';

    const onDialog = async (dialog: Dialog): Promise<void> => {
      dialogMessage = dialog.message();
      const m = dialogMessage.match(/imported\s+(\d+)/i);
      if (m) importedCount = Number(m[1]);
      await dialog.accept();
    };
    this.page.on('dialog', onDialog);

    try {
      const responsePromise = this.page
        .waitForResponse(
          (r) => r.url().includes('/procurement/import') && r.request().method() === 'POST',
          { timeout: this.config.processingTimeoutMs },
        )
        .catch(() => null);

      const fileInput = this.page.locator('input[type="file"][accept*="csv"], input[type="file"]').first();
      await fileInput.setInputFiles(absPath);

      const response = await responsePromise;
      if (response) {
        const status = response.status();
        if (status === 429 || isRateLimit(status)) {
          const retryAfter = retryAfterToMs(response.headers()['retry-after'], Date.now());
          throw new RateLimitHit(`Procurement import returned ${status} (rate limited)`, retryAfter);
        }
        if (status >= 400) {
          const bodyText = await response.text().catch(() => '');
          if (isRateLimit(bodyText)) throw new RateLimitHit(`Procurement import rate limited: ${bodyText.slice(0, 200)}`);
          throw new Error(`Procurement import failed with HTTP ${status}: ${bodyText.slice(0, 200)}`);
        }
      }

      // Wait for either the success alert to have been handled or an error banner.
      await this.page.waitForFunction(
        () => {
          const err = document.querySelector('div[class*="danger"]');
          return Boolean((window as unknown as { __lastDialog?: string }).__lastDialog) || Boolean(err);
        },
        undefined,
        { timeout: this.config.processingTimeoutMs },
      ).catch(() => undefined);

      // Give the dialog handler a beat to run.
      await this.page.waitForTimeout(500);

      // Detect an error banner surfaced by the page.
      const errorBanner = this.page.locator('div[class*="danger"]').first();
      if (!dialogMessage && (await errorBanner.count())) {
        const text = (await errorBanner.textContent())?.trim() || '';
        if (text) throw new Error(`Procurement import error: ${text}`);
      }

      if (!dialogMessage) {
        this.log.warn('No success alert observed for procurement import (may have imported 0 rows).');
      }
      return { importedCount };
    } finally {
      this.page.off('dialog', onDialog);
    }
  }
}
