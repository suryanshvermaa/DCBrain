/**
 * Safe validation runner for Test Mode (--test <file>) and Batch Mode
 * (--batch-size N). This is deliberately SEPARATE from the full-dataset
 * orchestrator (uploader.ts): its job is to prove the uploader is reliable and
 * rate-limit-safe on a tiny, controlled set of files before anyone runs the whole
 * dataset.
 *
 * Guarantees:
 *   • One file at a time — never parallel.
 *   • After each upload it waits for processing + indexing to complete (Documents
 *     reach PROCESSED; Procurement/Schedule imports are synchronous).
 *   • Verifies success through the UI (row visible + status, or import banner).
 *   • Configurable delay between uploads.
 *   • On a 429 / "Too Many Requests" / auth-lockout signal it PAUSES for a
 *     cooldown, retries, and ABORTS the run if the limit persists.
 *   • Screenshots on BOTH success and failure.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from 'playwright';
import type { UploadConfig } from './config.js';
import type { Logger } from './logger.js';
import type { ClassifiedFile, ModuleName } from './types.js';
import { checksum } from './scanner.js';
import { sleep } from './retry.js';
import { isRateLimit, RateLimitHit } from './rateLimit.js';
import { LoginPage } from './pages/LoginPage.js';
import { ProjectPage } from './pages/ProjectPage.js';
import { DocumentsPage } from './pages/DocumentsPage.js';
import { ProcurementPage } from './pages/ProcurementPage.js';
import { SchedulePage } from './pages/SchedulePage.js';

const ENGINES = { chromium, firefox, webkit } as const;

export interface FileResult {
  relPath: string;
  fileName: string;
  module: ModuleName;
  category: string;
  checksum: string;
  /** Overall verdict for this file. */
  status: 'success' | 'failed' | 'aborted';
  /** UI-observed detail (indexing status, imported count, activity count, error). */
  detail: string;
  /** Whether indexing completed (Documents only; null for sync imports). */
  indexed: boolean | null;
  attempts: number;
  rateLimitHits: number;
  durationMs: number;
  successScreenshot?: string;
  failureScreenshot?: string;
  error?: string;
}

export interface ValidationOutcome {
  mode: 'test' | 'batch';
  results: FileResult[];
  startedAtIso: string;
  finishedAtIso: string;
  durationMs: number;
  totalRateLimitHits: number;
  aborted: boolean;
  abortReason?: string;
}

export interface ValidatorDeps {
  config: UploadConfig;
  log: Logger;
  artifactsDir: string;
  mode: 'test' | 'batch';
}

export class Validator {
  private browser!: Browser;
  private context!: BrowserContext;
  private page!: Page;
  private docs!: DocumentsPage;
  private proc!: ProcurementPage;
  private sched!: SchedulePage;
  private totalRateLimitHits = 0;

  constructor(private readonly deps: ValidatorDeps) {}

  async run(files: ClassifiedFile[]): Promise<ValidationOutcome> {
    const startedAtIso = new Date().toISOString();
    const start = Date.now();
    const { config, log } = this.deps;
    const results: FileResult[] = [];
    let aborted = false;
    let abortReason: string | undefined;

    await this.launch();
    try {
      await new LoginPage(this.page, config, log).login();
      await new ProjectPage(this.page, config, log).ensureSelected();
      this.docs = new DocumentsPage(this.page, config, log);
      this.proc = new ProcurementPage(this.page, config, log);
      this.sched = new SchedulePage(this.page, config, log);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        log.info(`[${i + 1}/${files.length}] ${file.destination}: ${file.fileName}`);
        const result = await this.processFile(file);
        results.push(result);

        if (result.status === 'aborted') {
          aborted = true;
          abortReason = result.error ?? 'Rate limit persisted beyond retry budget';
          log.error(`Aborting validation run: ${abortReason}`);
          break;
        }

        // Configurable inter-upload delay (skip after the last file).
        if (i < files.length - 1) {
          log.debug(`Waiting ${config.uploadDelayMs}ms before next upload…`);
          await sleep(config.uploadDelayMs);
        }
      }
    } finally {
      await this.close();
    }

    return {
      mode: this.deps.mode,
      results,
      startedAtIso,
      finishedAtIso: new Date().toISOString(),
      durationMs: Date.now() - start,
      totalRateLimitHits: this.totalRateLimitHits,
      aborted,
      abortReason,
    };
  }

  /** Upload + verify one file, with rate-limit cooldown/retry/abort. */
  private async processFile(file: ClassifiedFile): Promise<FileResult> {
    const { config, log } = this.deps;
    const start = Date.now();
    const base: FileResult = {
      relPath: file.relPath,
      fileName: file.fileName,
      module: file.destination as ModuleName,
      category: file.category,
      checksum: safeChecksum(file.absPath),
      status: 'failed',
      detail: '',
      indexed: null,
      attempts: 0,
      rateLimitHits: 0,
      durationMs: 0,
    };

    const maxAttempts = config.rateLimit.maxRetries + 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      base.attempts = attempt;
      try {
        const detail = await this.uploadAndVerify(file);
        base.status = 'success';
        base.detail = detail.detail;
        base.indexed = detail.indexed;
        base.durationMs = Date.now() - start;
        base.successScreenshot = await this.screenshot('success', file.fileName);
        log.success(`${file.fileName} ✓ (${detail.detail})`);
        return base;
      } catch (err) {
        const rateLimited = err instanceof RateLimitHit || isRateLimit(err);
        const message = err instanceof Error ? err.message : String(err);

        if (rateLimited) {
          this.totalRateLimitHits++;
          base.rateLimitHits++;
          base.failureScreenshot = await this.screenshot('ratelimit', file.fileName);

          if (attempt >= maxAttempts) {
            base.status = 'aborted';
            base.error = `Rate limit persisted after ${maxAttempts} attempts: ${message}`;
            base.detail = base.error;
            base.durationMs = Date.now() - start;
            log.error(`${file.fileName} ✗ aborted — ${base.error}`);
            return base;
          }

          const cooldown = this.cooldownFor(attempt, err);
          log.warn(`Rate limit hit on ${file.fileName} (attempt ${attempt}/${maxAttempts}). Cooling down ${cooldown}ms then retrying…`);
          await sleep(cooldown);
          continue;
        }

        // Non-rate-limit error: capture and stop retrying this file.
        base.status = 'failed';
        base.error = message;
        base.detail = message;
        base.durationMs = Date.now() - start;
        base.failureScreenshot = await this.screenshot('failure', file.fileName);
        log.error(`${file.fileName} ✗ — ${message}`);
        return base;
      }
    }

    base.durationMs = Date.now() - start;
    return base;
  }

  /** Perform the module-appropriate upload and verify through the UI. */
  private async uploadAndVerify(
    file: ClassifiedFile,
  ): Promise<{ detail: string; indexed: boolean | null }> {
    const { config } = this.deps;

    if (file.destination === 'Documents') {
      await this.docs.goto();
      
      const existingStatus = await this.docs.findDocumentStatus(file.fileName);
      if (existingStatus) {
        return { detail: `already exists (status=${existingStatus}); skipped upload`, indexed: existingStatus === 'processed' };
      }
      
      const before = await this.docs.documentTotal();
      const { totalAfter } = await this.docs.uploadSingle(file.absPath, file.category);
      if (totalAfter < before + 1) {
        // Count didn't grow — confirm via search before declaring failure.
        const status = await this.docs.findDocumentStatus(file.fileName);
        if (!status) throw new Error(`Upload not reflected in UI (count ${before} → ${totalAfter}, file not found by search)`);
      }

      if (!config.verifyIndexing) {
        const status = (await this.docs.findDocumentStatus(file.fileName)) ?? 'unknown';
        return { detail: `uploaded; status=${status} (indexing check skipped)`, indexed: null };
      }

      const { status, indexed } = await this.docs.waitForIndexed(file.fileName);
      if (!indexed) throw new Error(`Document reached terminal status "${status}" (not indexed)`);
      return { detail: `indexed (status=${status}); count ${before} → ${totalAfter}`, indexed: true };
    }

    if (file.destination === 'Procurement') {
      await this.proc.goto();
      const { importedCount } = await this.proc.importFile(file.absPath);
      if (importedCount <= 0) throw new Error('Procurement import reported 0 items (schema/header mismatch — see gap analysis)');
      return { detail: `imported ${importedCount} procurement item(s)`, indexed: null };
    }

    // Schedule Risk
    await this.sched.goto();
    const exists = await this.sched.hasImportHistory(file.fileName);
    if (exists) {
      return { detail: `already exists in history; skipped upload`, indexed: null };
    }
    const { activityCount } = await this.sched.importFile(file.absPath);
    if (activityCount <= 0) throw new Error('Schedule import parsed 0 activities');
    return { detail: `parsed ${activityCount} schedule activit(y/ies)`, indexed: null };
  }

  /** Exponential cooldown, honoring Retry-After when present, capped by config. */
  private cooldownFor(attempt: number, err: unknown): number {
    const { cooldownMs, maxCooldownMs } = this.deps.config.rateLimit;
    const suggested = err instanceof RateLimitHit ? err.retryAfterMs : undefined;
    const backoff = cooldownMs * 2 ** (attempt - 1);
    return Math.min(maxCooldownMs, Math.max(suggested ?? 0, backoff));
  }

  // --- browser lifecycle ---
  private async launch(): Promise<void> {
    const { config } = this.deps;
    const engine = ENGINES[config.browser];
    this.browser = await engine.launch({ headless: config.headless, slowMo: config.slowMoMs });
    this.context = await this.browser.newContext({
      recordVideo: config.video ? { dir: path.join(this.deps.artifactsDir, 'videos'), size: { width: 1920, height: 1080 } } : undefined,
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
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

  private async screenshot(kind: string, fileName: string): Promise<string | undefined> {
    try {
      const dir = path.join(this.deps.artifactsDir, 'screenshots');
      fs.mkdirSync(dir, { recursive: true });
      const out = path.join(dir, `${Date.now()}-${kind}-${safe(fileName)}.png`);
      await this.page.screenshot({ path: out, fullPage: true });
      return out;
    } catch {
      return undefined;
    }
  }
}

function safeChecksum(absPath: string): string {
  try {
    return checksum(absPath);
  } catch {
    return '';
  }
}

function safe(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
}
