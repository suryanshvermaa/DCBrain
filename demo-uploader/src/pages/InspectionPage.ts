/**
 * Inspection create page object (/inspections).
 *
 * Mirrors frontend/src/app/inspections/page.tsx:
 *   - header "New Inspection" button opens a modal (heading "Create Inspection")
 *   - fields (plain inputs, no <select>):
 *       Title         <input> required (placeholder "Inspection title")
 *       Discipline    <input> optional (placeholder "e.g. Electrical")
 *       ITP Reference <input> optional (placeholder "ITP-001")
 *       Inspector     <input> optional (placeholder "Name")
 *       Scheduled Date <input type=date> optional
 *       Hold point    <input type=checkbox id="holdPoint">
 *   - submit button "Create Inspection"; on success the modal closes, list refreshes
 */

import type { Page } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';
import type { InspectionRecord } from '../seedData.js';
import { selectProjectOnPage } from './selectProject.js';
import { watchCreate, assertCreateOk } from './formHelpers.js';

const HEADING = 'Create Inspection';

export class InspectionPage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private url(): string {
    return new URL('/inspections', this.config.baseUrl).toString();
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url(), { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('button:has-text("New Inspection")', { timeout: this.config.timeoutMs });
  }

  async selectProject(): Promise<void> {
    await selectProjectOnPage(this.page, this.config.project.name);
  }

  async createOne(rec: InspectionRecord): Promise<string> {
    await this.page.click('button:has-text("New Inspection")');
    await this.page.waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
      timeout: this.config.timeoutMs,
    });

    await this.page.fill('input[placeholder="Inspection title"]', rec.title);
    if (rec.discipline) {
      const d = this.page.locator('input[placeholder*="e.g. Electrical"]');
      if (await d.count()) await d.first().fill(rec.discipline);
    }
    if (rec.itpRef) {
      const r = this.page.locator('input[placeholder="ITP-001"]');
      if (await r.count()) await r.first().fill(rec.itpRef);
    }
    if (rec.inspector) {
      const n = this.page.locator('input[placeholder="Name"]');
      if (await n.count()) await n.first().fill(rec.inspector);
    }
    if (rec.holdPoint) {
      const cb = this.page.locator('#holdPoint');
      if (await cb.count()) await cb.setChecked(true).catch(() => undefined);
    }

    const respP = watchCreate(this.page, '/inspections', this.config.processingTimeoutMs);
    await this.page.click('button:has-text("Create Inspection")');
    await assertCreateOk(await respP, 'Inspection create');

    await this.page
      .waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
        state: 'detached',
        timeout: this.config.processingTimeoutMs,
      })
      .catch(() => undefined);

    return `${rec.holdPoint ? 'hold-point' : 'inspection'} — ${rec.title}`;
  }
}
