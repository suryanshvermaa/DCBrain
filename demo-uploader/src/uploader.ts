/**
 * Upload orchestrator — drives the browser end-to-end:
 *
 *   login → ensure project → for each module:
 *     Documents      : batch files by category, upload each batch, verify count grew
 *     Procurement    : import each schema-matching table, verify imported count
 *     Schedule Risk  : import each P6 XML, verify parsed activity count
 *
 * Everything happens through the UI (no API/DB calls). Progress is persisted
 * after every unit so the run is resumable, and failures never abort the run.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as readline from 'node:readline/promises';
import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from 'playwright';
import type { UploadConfig } from './config.js';
import type { Logger } from './logger.js';
import type { ClassifiedFile, ModuleName } from './types.js';
import { ProgressStore } from './progress.js';
import { checksum } from './scanner.js';
import { withRetry, sleep } from './retry.js';
import { LoginPage } from './pages/LoginPage.js';
import { ProjectPage } from './pages/ProjectPage.js';
import { DocumentsPage } from './pages/DocumentsPage.js';
import { ProcurementPage } from './pages/ProcurementPage.js';
import { SchedulePage } from './pages/SchedulePage.js';

const ENGINES = { chromium, firefox, webkit } as const;

export interface UploaderDeps {
  config: UploadConfig;
  log: Logger;
  progress: ProgressStore;
  artifactsDir: string;
  resume: boolean;
  interactive?: boolean;
}

export interface RunOutcome {
  uploaded: number;
  failed: number;
  skipped: number;
  retries: number;
  durationMs: number;
  validations: ValidationRecord[];
  videoPath?: string;
}

export interface ValidationRecord {
  unit: string;
  module: ModuleName;
  ok: boolean;
  detail: string;
}

export class Uploader {
  private browser!: Browser;
  private context!: BrowserContext;
  private page!: Page;
  private retriesUsed = 0;
  private readonly validations: ValidationRecord[] = [];

  constructor(private readonly deps: UploaderDeps) { }

  async run(files: ClassifiedFile[]): Promise<RunOutcome> {
    const start = Date.now();
    const { config, log } = this.deps;

    await this.launch();
    try {
      const login = new LoginPage(this.page, config, log);
      await login.login();

      const project = new ProjectPage(this.page, config, log);
      await project.ensureSelected();

      for (const moduleName of config.modules) {
        const moduleFiles = files.filter((f) => f.destination === moduleName);
        if (moduleFiles.length === 0) {
          log.info(`No files for ${moduleName}, skipping module.`);
          continue;
        }
        log.info(`── ${moduleName}: ${moduleFiles.length} file(s) ──`);
        if (moduleName === 'Documents') await this.runDocuments(moduleFiles);
        else if (moduleName === 'Procurement') await this.runSingleFileModule(moduleFiles, 'Procurement');
        else if (moduleName === 'Schedule Risk') await this.runSingleFileModule(moduleFiles, 'Schedule Risk');
      }
    } finally {
      await this.close();
    }

    const counts = this.deps.progress.counts();
    return {
      uploaded: counts.uploaded,
      failed: counts.failed,
      skipped: counts.skipped,
      retries: this.retriesUsed,
      durationMs: Date.now() - start,
      validations: this.validations,
      videoPath: await this.videoPath(),
    };
  }

  // --- Documents: batched by category ---
  private async runDocuments(files: ClassifiedFile[]): Promise<void> {
    const { config, log } = this.deps;
    const docs = new DocumentsPage(this.page, config, log);
    await docs.goto();

    // Group by category so each batch carries a coherent category value.
    const byCategory = new Map<string, ClassifiedFile[]>();
    for (const f of files) {
      if (this.shouldSkip(f)) continue;
      const list = byCategory.get(f.category) ?? [];
      list.push(f);
      byCategory.set(f.category, list);
    }

    for (const [category, catFiles] of byCategory) {
      for (let i = 0; i < catFiles.length; i += config.documentsBatchSize) {
        const batch = catFiles.slice(i, i + config.documentsBatchSize);
        const label = `Documents[${category}] batch ${Math.floor(i / config.documentsBatchSize) + 1} (${batch.length} files)`;
        await this.processUnit(label, 'Documents', batch, async () => {

          const neededFiles: typeof batch = [];
          for (const f of batch) {
            const existing = await docs.findDocumentStatus(f.fileName);
            if (!existing) {
              neededFiles.push(f);
            } else {
              log.info(`Skipping ${f.fileName} (already exists: ${existing})`);
            }
          }

          if (neededFiles.length === 0) {
            this.validations.push({ unit: label, module: 'Documents', ok: true, detail: 'all files already exist; skipped' });
            return;
          }

          const totalBefore = await docs.documentTotal();
          const { totalAfter } = await docs.uploadBatch(neededFiles.map((f) => f.absPath), category);
          const grew = totalAfter >= totalBefore + neededFiles.length;
          this.validations.push({
            unit: label,
            module: 'Documents',
            ok: grew,
            detail: `document total ${totalBefore} → ${totalAfter} (expected +${neededFiles.length})`,
          });
          if (!grew) {
            log.warn(`${label}: document count did not grow as expected (${totalBefore} → ${totalAfter}).`);
          }
        });
        await sleep(config.uploadDelayMs);
      }
    }
  }

  // --- Procurement / Schedule: one file per import ---
  private async runSingleFileModule(files: ClassifiedFile[], moduleName: 'Procurement' | 'Schedule Risk'): Promise<void> {
    const { config, log } = this.deps;
    const proc = new ProcurementPage(this.page, config, log);
    const sched = new SchedulePage(this.page, config, log);
    if (moduleName === 'Procurement') await proc.goto();
    else await sched.goto();

    for (const f of files) {
      if (this.shouldSkip(f)) continue;
      const label = `${moduleName}: ${f.fileName}`;
      await this.processUnit(label, moduleName, [f], async () => {
        if (moduleName === 'Procurement') {
          await proc.goto();
          const { importedCount } = await proc.importFile(f.absPath);
          this.validations.push({
            unit: label,
            module: moduleName,
            ok: importedCount > 0,
            detail: `imported ${importedCount} procurement item(s)`,
          });
          if (importedCount === 0) log.warn(`${label}: imported 0 items (header/schema mismatch — see gap analysis).`);
        } else {
          await sched.goto();
          const exists = await sched.hasImportHistory(f.fileName);
          if (exists) {
            log.info(`Skipping ${f.fileName} (already imported in Schedule Risk)`);
            this.validations.push({
              unit: label,
              module: moduleName,
              ok: true,
              detail: `already exists in history; skipped`,
            });
            return;
          }
          const { activityCount } = await sched.importFile(f.absPath);
          this.validations.push({
            unit: label,
            module: moduleName,
            ok: activityCount > 0,
            detail: `parsed ${activityCount} schedule activit(y/ies)`,
          });
        }
      });
      await sleep(config.uploadDelayMs);
    }
  }

  /**
   * Wraps a single upload unit with retry, checksum/duplicate handling,
   * progress persistence, and failure screenshots.
   */
  private async processUnit(
    label: string,
    moduleName: ModuleName,
    files: ClassifiedFile[],
    action: () => Promise<void>,
  ): Promise<void> {
    const { config, log, progress, interactive } = this.deps;

    if (interactive) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      try {
        const answer = await rl.question(`\n[Interactive] Ready to process: ${label}\nProceed? [Y/n/q(uit)]: `);
        const choice = answer.trim().toLowerCase();
        if (choice === 'q' || choice === 'quit') {
          log.info('Run aborted by user.');
          process.exit(0);
        }
        if (choice === 'n' || choice === 'no') {
          log.warn(`Skipped by user: ${label}`);
          for (const f of files) {
            progress.update(f.relPath, { status: 'skipped', lastError: 'Skipped by user (interactive mode)' });
          }
          return;
        }
      } finally {
        rl.close();
      }
    }

    try {
      await withRetry(
        async () => {
          await action();
        },
        {
          retries: config.retryCount,
          baseDelayMs: config.retryBackoffMs,
          label,
          log,
          onRetry: async (attempt) => {
            this.retriesUsed++;
            for (const f of files) {
              const rec = progress.get(f.relPath);
              progress.update(f.relPath, { attempts: (rec?.attempts ?? 0) + 1 });
            }
            await this.screenshot(`retry-${attempt}-${safe(label)}`);
          },
        },
      );

      for (const f of files) {
        progress.update(f.relPath, {
          destination: moduleName,
          status: 'uploaded',
          checksum: checksum(f.absPath),
          attempts: (progress.get(f.relPath)?.attempts ?? 0) + 1,
        });
      }
      log.success(`${label} ✓`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      for (const f of files) {
        progress.update(f.relPath, {
          destination: moduleName,
          status: 'failed',
          attempts: (progress.get(f.relPath)?.attempts ?? 0) + 1,
          lastError: message,
        });
      }
      await this.screenshot(`fail-${safe(label)}`);
      log.error(`${label} ✗ — ${message}`);
      // Continue after failure (never abort the whole run).
    }
  }

  private shouldSkip(f: ClassifiedFile): boolean {
    // All local state checks (including checksums) have been removed.
    // The uploader will strictly use server-side UI checks to see if the file exists.
    return false;
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

  private async screenshot(name: string): Promise<void> {
    if (!this.deps.config.screenshotOnFailure) return;
    try {
      const dir = path.join(this.deps.artifactsDir, 'screenshots');
      fs.mkdirSync(dir, { recursive: true });
      await this.page.screenshot({ path: path.join(dir, `${Date.now()}-${name}.png`), fullPage: true });
    } catch {
      /* ignore */
    }
  }

  private async videoPath(): Promise<string | undefined> {
    try {
      const video = this.page?.video();
      return video ? await video.path() : undefined;
    } catch {
      return undefined;
    }
  }
}

function safe(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
}
