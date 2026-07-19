/**
 * Change Order create page object (/change-orders).
 *
 * Mirrors frontend/src/app/change-orders/page.tsx:
 *   - header "New CO" button opens a modal (heading "New Change Order")
 *   - fields:
 *       Title       <input> required (placeholder "Change order title")
 *       Description <textarea> required (placeholder "Scope of changes...")
 *       Reason      <input> optional (placeholder "Why this change is needed")
 *       Cost Impact ($)        <input type=number> (placeholder "0")
 *       Schedule Impact (days) <input type=number> (placeholder "0")
 *   - submit button "Create CO"; on success the modal closes, list + summary refresh
 */

import type { Page } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';
import type { ChangeOrderRecord } from '../seedData.js';
import { selectProjectOnPage } from './selectProject.js';
import { watchCreate, assertCreateOk } from './formHelpers.js';

const HEADING = 'New Change Order';

export class ChangeOrderPage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private url(): string {
    return new URL('/change-orders', this.config.baseUrl).toString();
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url(), { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('button:has-text("New CO")', { timeout: this.config.timeoutMs });
  }

  async selectProject(): Promise<void> {
    await selectProjectOnPage(this.page, this.config.project.name);
  }

  async createOne(rec: ChangeOrderRecord): Promise<string> {
    await this.page.click('button:has-text("New CO")');
    await this.page.waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
      timeout: this.config.timeoutMs,
    });

    await this.page.fill('input[placeholder="Change order title"]', rec.title);
    await this.page.fill('textarea[placeholder*="Scope of changes"]', rec.description);
    if (rec.reason) {
      const r = this.page.locator('input[placeholder*="Why this change is needed"]');
      if (await r.count()) await r.first().fill(rec.reason);
    }

    // Two number inputs, in DOM order: Cost Impact, then Schedule Impact.
    const numbers = this.page.locator('input[type="number"]');
    if ((await numbers.count()) >= 2) {
      await numbers.nth(0).fill(String(rec.costImpact));
      await numbers.nth(1).fill(String(rec.scheduleImpactDays));
    }

    const respP = watchCreate(this.page, '/change-orders', this.config.processingTimeoutMs);
    await this.page.click('button:has-text("Create CO")');
    await assertCreateOk(await respP, 'Change Order create');

    await this.page
      .waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
        state: 'detached',
        timeout: this.config.processingTimeoutMs,
      })
      .catch(() => undefined);

    return `$${rec.costImpact.toLocaleString()} / ${rec.scheduleImpactDays}d — ${rec.title}`;
  }
}
