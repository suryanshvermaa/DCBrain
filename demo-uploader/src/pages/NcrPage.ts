/**
 * NCR create page object (/ncrs).
 *
 * Mirrors frontend/src/app/ncrs/page.tsx:
 *   - header "New NCR" button opens a modal (heading "Raise New NCR")
 *   - the modal is NOT a <form> — submit ONLY by clicking "Submit NCR"
 *     (pressing Enter will not submit)
 *   - fields (no id/name — target by placeholder/type):
 *       Title       <input>  required
 *       Description <textarea> required
 *       Severity    <select> MINOR|MAJOR|CRITICAL
 *       Discipline  <input> optional
 *       Root Cause  <input> optional
 *   - on success the modal closes and the list refreshes
 */

import type { Page } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';
import type { NcrRecord } from '../seedData.js';
import { selectProjectOnPage } from './selectProject.js';
import { watchCreate, assertCreateOk } from './formHelpers.js';

const HEADING = 'Raise New NCR';

export class NcrPage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private url(): string {
    return new URL('/ncrs', this.config.baseUrl).toString();
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url(), { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('button:has-text("New NCR")', { timeout: this.config.timeoutMs });
  }

  async selectProject(): Promise<void> {
    await selectProjectOnPage(this.page, this.config.project.name);
  }

  async createOne(rec: NcrRecord): Promise<string> {
    await this.page.click('button:has-text("New NCR")');
    await this.page.waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
      timeout: this.config.timeoutMs,
    });

    await this.page.fill('input[placeholder*="Concrete pouring defect"]', rec.title);
    await this.page.fill('textarea[placeholder*="Detailed description of the non-conformance"]', rec.description);

    const severity = this.page.locator('select').filter({ has: this.page.locator('option[value="MAJOR"]') }).first();
    if (await severity.count()) await severity.selectOption({ value: rec.severity }).catch(() => undefined);

    if (rec.discipline) {
      const disc = this.page.locator('input[placeholder*="Civil, Mechanical"]');
      if (await disc.count()) await disc.first().fill(rec.discipline);
    }
    if (rec.rootCause) {
      const rc = this.page.locator('input[placeholder*="root cause"]');
      if (await rc.count()) await rc.first().fill(rec.rootCause);
    }

    const respP = watchCreate(this.page, '/ncrs', this.config.processingTimeoutMs);
    await this.page.click('button:has-text("Submit NCR")');
    await assertCreateOk(await respP, 'NCR create');

    await this.page
      .waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
        state: 'detached',
        timeout: this.config.processingTimeoutMs,
      })
      .catch(() => undefined);

    return `${rec.severity} — ${rec.title}`;
  }
}
