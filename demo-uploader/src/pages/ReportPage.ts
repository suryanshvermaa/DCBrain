/**
 * Report generate page object (/reports).
 *
 * Mirrors frontend/src/app/reports/page.tsx:
 *   - header "Generate Report" button (disabled until a project is selected)
 *     opens a modal (heading "Generate Report")
 *   - report type is chosen via a grid of 6 toggle <button>s (single-select):
 *       "Daily Status"(DAILY) "Weekly Summary"(WEEKLY) "Executive Briefing"(EXECUTIVE)
 *       "Compliance"(COMPLIANCE) "Risk Assessment"(RISK) "Procurement"(PROCUREMENT)
 *   - submit button "Generate" → POST /reports/generate
 *   - on success the modal closes and a new row appears in "Report History"
 */

import type { Page } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';
import type { ReportRecord, ReportType } from '../seedData.js';
import { selectProjectOnPage } from './selectProject.js';
import { watchCreate, assertCreateOk } from './formHelpers.js';

const HEADING = 'Generate Report';

const TYPE_LABEL: Readonly<Record<ReportType, string>> = {
  DAILY: 'Daily Status',
  WEEKLY: 'Weekly Summary',
  EXECUTIVE: 'Executive Briefing',
  COMPLIANCE: 'Compliance',
  RISK: 'Risk Assessment',
  PROCUREMENT: 'Procurement',
};

export class ReportPage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private url(): string {
    return new URL('/reports', this.config.baseUrl).toString();
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url(), { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('button:has-text("Generate Report")', { timeout: this.config.timeoutMs });
  }

  async selectProject(): Promise<void> {
    // Selecting the project enables the "Generate Report" button.
    await selectProjectOnPage(this.page, this.config.project.name);
  }

  async createOne(rec: ReportRecord): Promise<string> {
    // Open the modal (the header button, not the modal's submit).
    await this.page.locator('button:has-text("Generate Report")').first().click();
    await this.page.waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
      timeout: this.config.timeoutMs,
    });

    // Pick the report type toggle button by its visible label.
    const label = TYPE_LABEL[rec.reportType];
    const toggle = this.page.locator(`button:has-text("${label}")`).first();
    if (await toggle.count()) await toggle.click();

    // Submit — the modal's "Generate" button.
    const respP = watchCreate(this.page, '/reports/generate', this.config.processingTimeoutMs);
    await this.page.locator('button:has-text("Generate")').last().click();
    await assertCreateOk(await respP, 'Report generate');

    await this.page
      .waitForSelector(`h2:has-text("${HEADING}"), h3:has-text("${HEADING}")`, {
        state: 'detached',
        timeout: this.config.processingTimeoutMs,
      })
      .catch(() => undefined);

    return `${label} report`;
  }
}
