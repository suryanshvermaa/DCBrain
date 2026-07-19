/**
 * Documents upload page object.
 *
 * Mirrors frontend/src/app/documents/page.tsx + DocumentUploadModal + FileUpload:
 *   - "Upload" button opens the modal
 *   - Category text input
 *   - hidden <input type="file" multiple> inside the drop zone (set via setInputFiles)
 *   - "Upload" submit button; progress bar shows while uploading; modal closes on success
 *
 * Verification uses the "Showing N of M documents" counter that the page renders.
 */

import type { Page, Response } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';
import { RateLimitHit, isRateLimit, retryAfterToMs } from '../rateLimit.js';

export class DocumentsPage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private url(): string {
    return new URL('/documents', this.config.baseUrl).toString();
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url(), { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('button:has-text("Upload"):not([disabled])', { timeout: this.config.timeoutMs });
  }

  /** Reads the "Showing N of M documents" total (M). Returns 0 if not shown. */
  async documentTotal(): Promise<number> {
    const el = this.page.locator('text=/Showing \\d+ of \\d+ documents/').first();
    if (!(await el.count())) return 0;
    const txt = await el.innerText();
    const m = txt.match(/of\s+(\d+)\s+documents/);
    return m ? Number(m[1]) : 0;
  }

  /**
   * Upload a batch of files under a single category.
   * Returns the document total reported after upload (for verification).
   */
  async uploadBatch(absPaths: string[], category: string): Promise<{ totalAfter: number }> {
    await this.page.click('button:has-text("Upload")');
    await this.page.waitForSelector('h2:has-text("Upload documents")', { timeout: this.config.timeoutMs });

    // Category field (only visible text input in the modal).
    const categoryInput = this.page.locator('.fixed input[type="text"], h2:has-text("Upload documents") ~ * input').first();
    // Fall back to the label-based lookup used in the modal.
    const labelled = this.page.getByLabel('Category', { exact: false });
    if (await labelled.count()) {
      await labelled.first().fill(category);
    } else if (await categoryInput.count()) {
      await categoryInput.fill(category);
    }

    // Set files on the hidden multiple file input inside the modal.
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(absPaths);

    // Wait for the file list to reflect the selection (FileUpload renders each name).
    await this.page.waitForTimeout(200);

    // Submit — the modal's primary "Upload" button (has an icon + text).
    const submit = this.page.locator('.fixed button:has-text("Upload")').last();
    await submit.click();

    // The modal closes when the upload resolves (handleUpload → setUploadOpen(false)).
    await this.page.waitForSelector('h2:has-text("Upload documents")', {
      state: 'detached',
      timeout: this.config.processingTimeoutMs,
    });

    const totalAfter = await this.documentTotal();
    return { totalAfter };
  }

  /**
   * Upload a SINGLE file through the modal and confirm the server accepted it.
   *
   * Unlike uploadBatch, this attaches a response watcher to the upload POST so we
   * can distinguish a genuine acceptance (201) from a rate-limit (429) or other
   * server error — the modal alone can't tell us that. Throws RateLimitHit on 429
   * so the orchestrator can apply a cooldown; throws a plain Error on other failures.
   */
  async uploadSingle(absPath: string, category: string): Promise<{ totalAfter: number; httpStatus: number }> {
    await this.page.click('button:has-text("Upload")');
    await this.page.waitForSelector('h2:has-text("Upload documents")', { timeout: this.config.timeoutMs });

    const labelled = this.page.getByLabel('Category', { exact: false });
    if (await labelled.count()) {
      await labelled.first().fill(category);
    }

    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(absPath);
    await this.page.waitForTimeout(150);

    // Watch the upload POST so we see the real HTTP status (429 detection).
    const responsePromise = this.page
      .waitForResponse(
        (r: Response) => r.url().includes('/documents/upload') && r.request().method() === 'POST',
        { timeout: this.config.processingTimeoutMs },
      )
      .catch(() => null);

    const submit = this.page.locator('.fixed button:has-text("Upload")').last();
    await submit.click();

    const response = await responsePromise;
    if (response) {
      const status = response.status();
      if (status === 429 || isRateLimit(status)) {
        const retryAfter = retryAfterToMs(response.headers()['retry-after'], Date.now());
        throw new RateLimitHit(`Documents upload returned ${status} (rate limited)`, retryAfter);
      }
      if (status >= 400) {
        const bodyText = await response.text().catch(() => '');
        if (isRateLimit(bodyText)) throw new RateLimitHit(`Documents upload rate limited: ${bodyText.slice(0, 200)}`);
        throw new Error(`Documents upload failed with HTTP ${status}: ${bodyText.slice(0, 200)}`);
      }
    }

    // Modal closes on success (handleUpload → setUploadOpen(false)).
    await this.page
      .waitForSelector('h2:has-text("Upload documents")', { state: 'detached', timeout: this.config.processingTimeoutMs })
      .catch(() => undefined);

    const totalAfter = await this.documentTotal();
    return { totalAfter, httpStatus: response?.status() ?? 0 };
  }

  /**
   * Find a document row by its original file name using the search box, and
   * return the status text shown by its ProcessingStatusBadge (lowercased,
   * e.g. "processed", "processing", "queued", "failed"), or null if not visible.
   */
  async findDocumentStatus(originalName: string): Promise<string | null> {
    const search = this.page.locator('input[placeholder="Search documents"]');
    if (await search.count()) {
      await search.first().fill(originalName);
      // Wait up to 2 seconds for the network request to finish and UI to update
      await this.page.waitForTimeout(2000);
    }

    // The row shows the original name; the badge is the status cell in that row.
    const row = this.page.locator('tr', { hasText: originalName }).first();
    if (!(await row.count())) return null;

    // Badge text = one of queued/uploaded/processing/processed/failed/archived.
    const badge = row.locator('span').filter({ hasText: /queued|uploaded|processing|processed|failed|archived/i }).first();
    if (!(await badge.count())) return null;
    return (await badge.innerText()).trim().toLowerCase();
  }

  /**
   * Poll the UI until the named document reaches a terminal indexing state.
   * Resolves with the final status. Terminal = "processed" (success) or "failed".
   * Throws on timeout so the caller can record it.
   */
  async waitForIndexed(originalName: string): Promise<{ status: string; indexed: boolean }> {
    const deadline = Date.now() + this.config.indexingTimeoutMs;
    let last: string | null = null;
    while (Date.now() < deadline) {
      // Refresh the list, then read status.
      const refresh = this.page.locator('button:has-text("Refresh")').first();
      if (await refresh.count()) await refresh.click().catch(() => undefined);
      last = await this.findDocumentStatus(originalName);
      if (last === 'processed') return { status: last, indexed: true };
      if (last === 'failed') return { status: last, indexed: false };
      await this.page.waitForTimeout(this.config.indexingPollMs);
    }
    throw new Error(`Indexing wait timed out for "${originalName}" after ${this.config.indexingTimeoutMs}ms (last status: ${last ?? 'unknown'})`);
  }
}
