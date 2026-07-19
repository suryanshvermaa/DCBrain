/**
 * Demo-record seeder — drives the browser to create a FIXED set of demo records
 * in ONE module through the UI (RFIs, NCRs, Inspections, Commissioning, Change
 * Orders, Simulations, or Reports).
 *
 * Design mirrors validate.ts (the upload validator): one record at a time, a
 * configurable delay between records, and 429/"Too Many Requests" cooldown →
 * retry → abort. Verification is LIGHT — each page object confirms the create
 * POST wasn't a rate-limit/error and that the modal closed (or the page
 * navigated); no screenshots, no markdown report.
 *
 * Each seed run touches exactly one module and never the others.
 */

import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from 'playwright';
import type { UploadConfig } from './config.js';
import type { Logger } from './logger.js';
import { sleep } from './retry.js';
import { isRateLimit, RateLimitHit } from './rateLimit.js';
import { LoginPage } from './pages/LoginPage.js';
import { RfiPage } from './pages/RfiPage.js';
import { NcrPage } from './pages/NcrPage.js';
import { InspectionPage } from './pages/InspectionPage.js';
import { CommissioningPage } from './pages/CommissioningPage.js';
import { ChangeOrderPage } from './pages/ChangeOrderPage.js';
import { SimulationPage } from './pages/SimulationPage.js';
import { ReportPage } from './pages/ReportPage.js';
import {
  type ModuleKey,
  RFIS,
  NCRS,
  INSPECTIONS,
  COMMISSIONING,
  CHANGE_ORDERS,
  SIMULATIONS,
  REPORTS,
} from './seedData.js';

const ENGINES = { chromium, firefox, webkit } as const;

export interface SeederDeps {
  config: UploadConfig;
  log: Logger;
}

export interface SeedSummary {
  module: ModuleKey;
  total: number;
  created: number;
  failed: number;
  aborted: boolean;
  abortReason?: string;
  durationMs: number;
}

/** A record + the page action that creates it, unified so run() is generic. */
interface SeedStep {
  label: string;
  create: () => Promise<string>;
}

export class Seeder {
  private browser!: Browser;
  private context!: BrowserContext;
  private page!: Page;

  constructor(private readonly deps: SeederDeps) {}

  async run(module: ModuleKey): Promise<SeedSummary> {
    const start = Date.now();
    const { config, log } = this.deps;
    const summary: SeedSummary = { module, total: 0, created: 0, failed: 0, aborted: false, durationMs: 0 };

    await this.launch();
    try {
      await new LoginPage(this.page, config, log).login();

      const steps = await this.buildSteps(module);
      summary.total = steps.length;
      log.info(`Seeding ${steps.length} ${module} record(s) into "${config.project.name}"`);

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (!step) continue;
        const outcome = await this.createWithRetry(module, i + 1, steps.length, step);

        if (outcome === 'created') summary.created++;
        else if (outcome === 'failed') summary.failed++;
        else {
          // aborted — rate limit persisted beyond the retry budget.
          summary.aborted = true;
          summary.abortReason = 'Rate limit persisted beyond retry budget';
          log.error(`Aborting ${module} seed: ${summary.abortReason}`);
          break;
        }

        if (i < steps.length - 1) await sleep(config.uploadDelayMs);
      }
    } finally {
      await this.close();
    }

    summary.durationMs = Date.now() - start;
    return summary;
  }

  /**
   * Attempt one record with rate-limit cooldown/retry. Returns:
   *   'created' — success
   *   'failed'  — non-rate error (recorded, run continues)
   *   'aborted' — rate limit persisted after all retries (run should stop)
   */
  private async createWithRetry(
    module: ModuleKey,
    n: number,
    total: number,
    step: SeedStep,
  ): Promise<'created' | 'failed' | 'aborted'> {
    const { config, log } = this.deps;
    const maxAttempts = config.rateLimit.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const detail = await step.create();
        log.success(`[${n}/${total}] ${module} ✓ ${detail}`);
        return 'created';
      } catch (err) {
        const rateLimited = err instanceof RateLimitHit || isRateLimit(err);
        const message = err instanceof Error ? err.message : String(err);

        if (rateLimited) {
          if (attempt >= maxAttempts) {
            log.error(`[${n}/${total}] ${module} ✗ aborted — rate limit persisted: ${message}`);
            return 'aborted';
          }
          const cooldown = this.cooldownFor(attempt, err);
          log.warn(`[${n}/${total}] ${module} rate limited (attempt ${attempt}/${maxAttempts}). Cooling down ${cooldown}ms…`);
          await sleep(cooldown);
          continue;
        }

        // Non-rate error: record and move on (light verification).
        log.error(`[${n}/${total}] ${module} ✗ — ${message}`);
        return 'failed';
      }
    }
    return 'failed';
  }

  private cooldownFor(attempt: number, err: unknown): number {
    const { cooldownMs, maxCooldownMs } = this.deps.config.rateLimit;
    const suggested = err instanceof RateLimitHit ? err.retryAfterMs : undefined;
    const backoff = cooldownMs * 2 ** (attempt - 1);
    return Math.min(maxCooldownMs, Math.max(suggested ?? 0, backoff));
  }

  /** Build the ordered create steps for a module, navigating to its page once. */
  private async buildSteps(module: ModuleKey): Promise<SeedStep[]> {
    const { config, log } = this.deps;

    switch (module) {
      case 'rfis': {
        const p = new RfiPage(this.page, config, log);
        await p.goto();
        await p.selectProject();
        return RFIS.map((r) => ({ label: r.subject, create: () => p.createOne(r) }));
      }
      case 'ncrs': {
        const p = new NcrPage(this.page, config, log);
        await p.goto();
        await p.selectProject();
        return NCRS.map((r) => ({ label: r.title, create: () => p.createOne(r) }));
      }
      case 'inspections': {
        const p = new InspectionPage(this.page, config, log);
        await p.goto();
        await p.selectProject();
        return INSPECTIONS.map((r) => ({ label: r.title, create: () => p.createOne(r) }));
      }
      case 'commissioning': {
        const p = new CommissioningPage(this.page, config, log);
        await p.goto();
        await p.selectProject();
        return COMMISSIONING.map((r) => ({ label: r.systemName, create: () => p.createOne(r) }));
      }
      case 'change-orders': {
        const p = new ChangeOrderPage(this.page, config, log);
        await p.goto();
        await p.selectProject();
        return CHANGE_ORDERS.map((r) => ({ label: r.title, create: () => p.createOne(r) }));
      }
      case 'simulations': {
        // SimulationPage.createOne navigates the list → new page itself each time.
        const p = new SimulationPage(this.page, config, log);
        return SIMULATIONS.map((r) => ({ label: r.scenarioName, create: () => p.createOne(r) }));
      }
      case 'reports': {
        const p = new ReportPage(this.page, config, log);
        await p.goto();
        await p.selectProject();
        return REPORTS.map((r) => ({ label: r.reportType, create: () => p.createOne(r) }));
      }
      default: {
        const _exhaustive: never = module;
        throw new Error(`Unknown module: ${String(_exhaustive)}`);
      }
    }
  }

  // --- browser lifecycle (mirrors validate.ts) ---
  private async launch(): Promise<void> {
    const { config } = this.deps;
    const engine = ENGINES[config.browser];
    this.browser = await engine.launch({ headless: config.headless, slowMo: config.slowMoMs });
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      acceptDownloads: true,
    });
    this.context.setDefaultTimeout(config.timeoutMs);
    this.page = await this.context.newPage();
  }

  private async close(): Promise<void> {
    try {
      await this.context?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.browser?.close();
    } catch {
      /* ignore */
    }
  }
}
