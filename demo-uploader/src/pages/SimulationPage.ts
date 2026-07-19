/**
 * Simulation create page object (/simulations → /simulations/new).
 *
 * Mirrors frontend/src/app/simulations/page.tsx + simulations/new/page.tsx:
 *   - "New Simulation" is a LINK (anchor) that navigates to
 *     /simulations/new?projectId=<id> — a SEPARATE PAGE (not a modal),
 *     heading "Run Delay Simulation".
 *   - fields:
 *       Scenario Name   <input> required (placeholder "e.g. Chiller Delivery Delay")
 *       Target Activity <select> required — populated ASYNC from
 *                        GET /schedule/activities (option value = activityId,
 *                        label "A1020 - Install Chiller"); first real option
 *                        is <option value="" disabled>Select an activity</option>.
 *       Delay (Days)    <input type=number> required, min 1, default 14
 *   - submit "Run Simulation" → POST /simulations/delay → navigates to
 *     /simulations/<id> on success (that navigation IS the success signal).
 *
 * We must select the project FIRST (so the link carries ?projectId=), then wait
 * for the activity <select> to be populated (> 1 option) before picking.
 */

import type { Page } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';
import type { SimulationRecord } from '../seedData.js';
import { selectProjectOnPage } from './selectProject.js';
import { watchCreate, assertCreateOk } from './formHelpers.js';

const HEADING = 'Run Delay Simulation';

export class SimulationPage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private listUrl(): string {
    return new URL('/simulations', this.config.baseUrl).toString();
  }

  async goto(): Promise<void> {
    await this.page.goto(this.listUrl(), { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('a:has-text("New Simulation"), button:has-text("New Simulation")', {
      timeout: this.config.timeoutMs,
    });
  }

  async selectProject(): Promise<void> {
    await selectProjectOnPage(this.page, this.config.project.name);
  }

  /**
   * Create one delay simulation. `activityIndex` is 1-based over the REAL
   * activity options (the disabled "Select an activity" placeholder is skipped).
   * If fewer activities exist than requested, the last available one is used.
   */
  async createOne(rec: SimulationRecord): Promise<string> {
    // Return to the list each time so the "New Simulation" link carries a fresh
    // ?projectId= and we start from a clean form.
    await this.goto();
    await this.selectProject();

    await this.page.click('a:has-text("New Simulation"), button:has-text("New Simulation")');
    
    // Wait for the URL to actually change to the new simulation page to avoid race conditions.
    await this.page.waitForURL((u) => u.pathname.includes('/simulations/new'), {
      timeout: this.config.timeoutMs,
    });

    await this.page.waitForSelector(`h1:has-text("${HEADING}"), h2:has-text("${HEADING}")`, {
      timeout: this.config.timeoutMs,
    });

    // Scenario name (robust locator based on label instead of just placeholder).
    const nameInput = this.page.locator('label', { hasText: 'Scenario Name' }).locator('..').locator('input');
    await nameInput.fill(rec.scenarioName);

    // Wait for the activity <select> to be populated (> 1 option = past the
    // disabled placeholder), since it loads asynchronously.
    const select = this.page.locator('select').last();
    await this.page
      .waitForFunction(
        () => {
          const sels = Array.from(document.querySelectorAll('select'));
          const s = sels[sels.length - 1];
          return !!s && s.options.length > 1;
        },
        undefined,
        { timeout: this.config.timeoutMs },
      )
      .catch(() => undefined);

    // Collect real (non-empty-value) option values and pick the requested one.
    const values = await select.locator('option').evaluateAll((opts) =>
      opts
        .map((o) => (o as HTMLOptionElement).value)
        .filter((v) => v && v.length > 0),
    );
    if (values.length === 0) {
      throw new Error('No schedule activities available to target — import a P6 schedule first.');
    }
    const idx = Math.min(Math.max(1, rec.activityIndex), values.length) - 1;
    const chosen = values[idx];
    if (chosen === undefined) throw new Error('Failed to resolve a target activity option.');
    await select.selectOption({ value: chosen });

    // Delay (Days).
    const delay = this.page.locator('input[type="number"]').first();
    if (await delay.count()) await delay.fill(String(rec.delayDays));

    // Submit — success signal is navigation to /simulations/<id>.
    const respP = watchCreate(this.page, '/simulations/delay', this.config.processingTimeoutMs);
    await this.page.click('button:has-text("Run Simulation")');
    await assertCreateOk(await respP, 'Simulation create');

    await this.page
      .waitForURL((u) => /\/simulations\/[^/]+/.test(u.pathname) && !u.pathname.endsWith('/new'), {
        timeout: this.config.processingTimeoutMs,
      })
      .catch(() => undefined);

    return `${rec.scenarioName} → ${chosen} (+${rec.delayDays}d)`;
  }
}
