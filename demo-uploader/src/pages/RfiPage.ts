/**
 * RFI create page object (/rfis).
 *
 * Mirrors frontend/src/app/rfis/page.tsx:
 *   - header "New RFI" button opens a modal (heading "Create Request for Information")
 *   - the modal IS a <form> (submits via the "Submit RFI" button)
 *   - fields (no id/name — target by placeholder/label/type):
 *       Subject   <input>  required
 *       Question  <textarea> required
 *       Priority  <select> LOW|MEDIUM|HIGH|CRITICAL
 *       Discipline <input> optional
 *   - on success the modal closes (heading detaches) and the list reloads
 */

import type { Page } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';
import type { RfiRecord } from '../seedData.js';
import { selectProjectOnPage } from './selectProject.js';
import { watchCreate, assertCreateOk } from './formHelpers.js';

const HEADING = 'Create Request for Information';

export class RfiPage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private url(): string {
    return new URL('/rfis', this.config.baseUrl).toString();
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url(), { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('button:has-text("New RFI")', { timeout: this.config.timeoutMs });
  }

  async selectProject(): Promise<void> {
    await selectProjectOnPage(this.page, this.config.project.name);
  }

  async createOne(rec: RfiRecord): Promise<string> {
    await this.page.click('button:has-text("New RFI")');
    await this.page.waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
      timeout: this.config.timeoutMs,
    });

    await this.page.fill('input[placeholder*="ASHRAE"]', rec.subject);
    await this.page.fill('textarea[placeholder*="Describe your inquiry"]', rec.question);

    const priority = this.page.locator('select').filter({ has: this.page.locator('option[value="CRITICAL"]') }).first();
    if (await priority.count()) await priority.selectOption({ value: rec.priority }).catch(() => undefined);

    if (rec.discipline) {
      const disc = this.page.locator('input[placeholder*="Electrical, Mechanical"]');
      if (await disc.count()) await disc.first().fill(rec.discipline);
    }

    const respP = watchCreate(this.page, '/rfis', this.config.processingTimeoutMs);
    await this.page.click('button:has-text("Submit RFI")');
    await assertCreateOk(await respP, 'RFI create');

    // Success = the modal heading detaches.
    await this.page
      .waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
        state: 'detached',
        timeout: this.config.processingTimeoutMs,
      })
      .catch(() => undefined);

    return `${rec.priority} — ${rec.subject}`;
  }
}
