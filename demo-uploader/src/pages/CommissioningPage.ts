/**
 * Commissioning create page object (/commissioning).
 *
 * Mirrors frontend/src/app/commissioning/page.tsx:
 *   - header "New Record" button opens a modal (heading "New Commissioning Record")
 *   - fields (all plain text inputs):
 *       System Name    <input> required (placeholder "e.g. Cooling System A")
 *       Test Reference <input> optional (placeholder "CX-001")
 *       Discipline     <input> optional (placeholder "e.g. MEP")
 *       Procedure      <input> optional (placeholder "Commissioning procedure name")
 *       Tested By      <input> optional (placeholder "Engineer name")
 *   - submit button "Create Record"; on success the modal closes, board refreshes
 */

import type { Page } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';
import type { CommissioningRecord } from '../seedData.js';
import { selectProjectOnPage } from './selectProject.js';
import { watchCreate, assertCreateOk } from './formHelpers.js';

const HEADING = 'New Commissioning Record';

export class CommissioningPage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private url(): string {
    return new URL('/commissioning', this.config.baseUrl).toString();
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url(), { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('button:has-text("New Record")', { timeout: this.config.timeoutMs });
  }

  async selectProject(): Promise<void> {
    await selectProjectOnPage(this.page, this.config.project.name);
  }

  async createOne(rec: CommissioningRecord): Promise<string> {
    await this.page.click('button:has-text("New Record")');
    await this.page.waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
      timeout: this.config.timeoutMs,
    });

    await this.page.fill('input[placeholder*="Cooling System A"]', rec.systemName);
    if (rec.testRef) {
      const t = this.page.locator('input[placeholder="CX-001"]');
      if (await t.count()) await t.first().fill(rec.testRef);
    }
    if (rec.discipline) {
      const d = this.page.locator('input[placeholder*="e.g. MEP"]');
      if (await d.count()) await d.first().fill(rec.discipline);
    }
    if (rec.procedure) {
      const p = this.page.locator('input[placeholder*="Commissioning procedure name"]');
      if (await p.count()) await p.first().fill(rec.procedure);
    }
    if (rec.testedBy) {
      const e = this.page.locator('input[placeholder="Engineer name"]');
      if (await e.count()) await e.first().fill(rec.testedBy);
    }

    const respP = watchCreate(this.page, '/commissioning', this.config.processingTimeoutMs);
    await this.page.click('button:has-text("Create Record")');
    await assertCreateOk(await respP, 'Commissioning create');

    await this.page
      .waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
        state: 'detached',
        timeout: this.config.processingTimeoutMs,
      })
      .catch(() => undefined);

    return rec.systemName;
  }
}
