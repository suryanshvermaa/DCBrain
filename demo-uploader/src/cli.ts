/**
 * DCBrain demo-data uploader — CLI entrypoint.
 *
 * Usage:
 *   pnpm upload-demo-data                 # full run (headed, resume off)
 *   pnpm upload-demo-data --resume        # skip already-uploaded files
 *   pnpm upload-demo-data --headless      # no visible browser
 *   pnpm upload-demo-data --dry-run       # NO browser; print per-module plan
 *   pnpm upload-demo-data --project "My Data Centre"
 *   pnpm upload-demo-data --module Documents --module "Schedule Risk"
 *
 * Flags override environment variables (DCBRAIN_*), which override upload.config.ts.
 * Everything happens through the UI — no direct API/DB access.
 */

import fs from 'node:fs';
import path from 'node:path';
import { resolveConfig, type CliOverrides } from './config.js';
import { scanDataset, repoRoot, uploaderRoot } from './scanner.js';
import { Logger } from './logger.js';
import { ProgressStore } from './progress.js';
import { writeReport } from './report.js';
import type { RunOutcome } from './uploader.js';
import type { ClassifiedFile, ModuleName } from './types.js';

interface ParsedArgs {
  overrides: CliOverrides;
  dryRun: boolean;
  resume: boolean;
  help: boolean;
  /** Test Mode: upload only this single file, verify, exit. */
  testFile?: string;
  /** Batch Mode: upload only this many files, then stop. */
  batchSize?: number;
  interactive?: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const overrides: CliOverrides = {};
  const modules: ModuleName[] = [];
  let dryRun = false;
  let resume = false;
  let interactive = false;
  let help = false;
  let testFile: string | undefined;
  let batchSize: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`Missing value for ${arg}`);
      return v;
    };
    switch (arg) {
      case '--dry-run': dryRun = true; break;
      case '--resume': resume = true; break;
      case '--interactive': interactive = true; break;
      case '--test': testFile = next(); break;
      case '--batch-size': batchSize = Number(next()); break;
      case '--delay-ms': overrides.uploadDelayMs = Number(next()); break;
      case '--verify-indexing': overrides.verifyIndexing = true; break;
      case '--no-verify-indexing': overrides.verifyIndexing = false; break;
      case '--indexing-timeout-ms': overrides.indexingTimeoutMs = Number(next()); break;
      case '--headless': overrides.headless = true; break;
      case '--headed': overrides.headless = false; break;
      case '--project': overrides.project = next(); break;
      case '--base-url': overrides.baseUrl = next(); break;
      case '--email': overrides.email = next(); break;
      case '--password': overrides.password = next(); break;
      case '--browser': overrides.browser = next() as CliOverrides['browser']; break;
      case '--dataset-root': overrides.datasetRoot = next(); break;
      case '--retry': overrides.retryCount = Number(next()); break;
      case '--timeout-ms': overrides.timeoutMs = Number(next()); break;
      case '--concurrency': overrides.concurrency = Number(next()); break;
      case '--module': modules.push(next() as ModuleName); break;
      case '--help': case '-h': help = true; break;
      default:
        if (arg.startsWith('--')) throw new Error(`Unknown flag: ${arg}`);
    }
  }
  if (modules.length) overrides.modules = modules;
  return { overrides, dryRun, resume, interactive, help, testFile, batchSize };
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(`DCBrain demo-data uploader

Validation / safety modes:
  --test <file-path>     TEST MODE: upload only this one file, verify it end-to-end, exit.
  --batch-size <n>       BATCH MODE: upload only the first N uploadable files, then stop.
  --delay-ms <n>         Delay between uploads (ms) — rate-limit safety.
  --no-verify-indexing   Skip waiting for documents to reach PROCESSED (default: wait).
  --indexing-timeout-ms <n>  Max wait for a document to finish indexing.

Full run:
  --dry-run              Do not open a browser; print the per-module upload plan and exit.
  --resume               Skip files already marked 'uploaded' in the progress store.
  --interactive          Prompt for confirmation before uploading each batch.
  --headless / --headed  Run without / with a visible browser window.
  --project "<name>"     Target project name (created if missing).
  --module "<name>"      Restrict to one module (repeatable): Documents | Procurement | "Schedule Risk".
  --base-url <url>       Frontend base URL (default http://localhost:3000).
  --email <email>        Login email.
  --password <pass>      Login password.
  --browser <engine>     chromium | firefox | webkit.
  --dataset-root <path>  Dataset directory to scan.
  --retry <n>            Retry attempts per upload unit.
  --timeout-ms <n>       Navigation/action timeout.
  -h, --help             Show this help.

Test/Batch modes upload ONE file at a time, wait for processing + indexing, verify
through the UI, screenshot on success and failure, apply the configured delay, pause +
retry on HTTP 429 / rate-limit signals (aborting if they persist), and write
TEST_UPLOAD_REPORT.md.
`);
}

function groupByModule(files: ClassifiedFile[]): Map<string, ClassifiedFile[]> {
  const groups = new Map<string, ClassifiedFile[]>();
  for (const f of files) {
    const key = f.destination;
    const list = groups.get(key) ?? [];
    list.push(f);
    groups.set(key, list);
  }
  return groups;
}

function printDryRun(files: ClassifiedFile[], modules: ModuleName[]): void {
  const groups = groupByModule(files);
  const order: string[] = [...modules, 'Excluded'];

  /* eslint-disable no-console */
  console.log('');
  console.log('DRY RUN — no browser launched. Planned uploads:');
  console.log('='.repeat(52));
  let uploadable = 0;
  for (const mod of order) {
    const list = groups.get(mod) ?? [];
    if (mod !== 'Excluded') uploadable += list.length;
    console.log('');
    console.log(`${mod}`);
    console.log(`${list.length} file(s)`);
    if (list.length === 0) continue;

    // Sub-breakdown by category (Documents) or file (imports).
    const byCat = new Map<string, number>();
    for (const f of list) byCat.set(f.category, (byCat.get(f.category) ?? 0) + 1);
    for (const [cat, n] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`   • ${cat}: ${n}`);
    }
    if (mod === 'Procurement' || mod === 'Schedule Risk') {
      for (const f of list) console.log(`     → ${f.relPath}`);
    }
  }
  console.log('');
  console.log('='.repeat(52));
  console.log(`Total uploadable: ${uploadable}`);
  console.log(`Excluded:         ${(groups.get('Excluded') ?? []).length}`);
  console.log(`Grand total:      ${files.length}`);
  console.log('');
  /* eslint-enable no-console */
}

/** Resolve the file set for Test Mode (single file) or Batch Mode (first N). */
function selectValidationFiles(
  parsed: ParsedArgs,
  uploadable: ClassifiedFile[],
): { mode: 'test' | 'batch'; files: ClassifiedFile[] } {
  if (parsed.testFile !== undefined) {
    const want = path.resolve(process.cwd(), parsed.testFile);
    const match = uploadable.find(
      (f) =>
        path.resolve(f.absPath) === want ||
        f.relPath === parsed.testFile ||
        f.relPath.endsWith(parsed.testFile!.replace(/\\/g, '/')) ||
        f.fileName === path.basename(parsed.testFile!),
    );
    if (!match) {
      throw new Error(
        `--test: "${parsed.testFile}" did not match any uploadable dataset file. ` +
          `Pass a path under the dataset root (e.g. project-data/09-project-controls/p6-schedules/Baseline-Schedule-R00.xml), ` +
          `or a bare file name. (Excluded files cannot be test-uploaded.)`,
      );
    }
    return { mode: 'test', files: [match] };
  }

  // Batch mode: first N uploadable files, respecting module order from config.
  const n = Math.max(0, Math.floor(parsed.batchSize ?? 0));
  return { mode: 'batch', files: uploadable.slice(0, n) };
}

/** Run Test/Batch validation and write TEST_UPLOAD_REPORT.md. */
async function runValidation(
  parsed: ParsedArgs,
  config: ReturnType<typeof resolveConfig>,
  uploadable: ClassifiedFile[],
  artifactsDir: string,
  datasetRoot: string,
  repo: string,
): Promise<void> {
  const { mode, files } = selectValidationFiles(parsed, uploadable);

  const log = new Logger(path.join(artifactsDir, 'test-upload.log.jsonl'));
  log.info(`Dataset: ${datasetRoot}`);
  log.info(`Mode: ${mode.toUpperCase()} | files: ${files.length}`);
  log.info(`Delay between uploads: ${config.uploadDelayMs}ms | Verify indexing: ${config.verifyIndexing}`);
  log.info(`Rate-limit policy: cooldown ${config.rateLimit.cooldownMs}ms, up to ${config.rateLimit.maxRetries} retries, cap ${config.rateLimit.maxCooldownMs}ms`);

  if (files.length === 0) {
    log.warn('No files selected for validation — nothing to do.');
    log.close();
    return;
  }

  // Lazy import so we only need Playwright when we actually drive the browser.
  const { Validator } = await import('./validate.js');
  const { writeTestReport } = await import('./testReport.js');

  const validator = new Validator({ config, log, artifactsDir, mode });
  const outcome = await validator.run(files);

  const reportPath = writeTestReport(config, outcome, repo);

  const ok = outcome.results.filter((r) => r.status === 'success').length;
  const failed = outcome.results.filter((r) => r.status === 'failed').length;
  log.info('─'.repeat(48));
  log.success(`Validation (${mode}): ${ok} ok, ${failed} failed, ${outcome.aborted ? 'ABORTED' : 'completed'} in ${Math.round(outcome.durationMs / 1000)}s`);
  log.info(`Rate-limit events: ${outcome.totalRateLimitHits}`);
  log.info(`Report: ${reportPath}`);
  log.info(`Artifacts: ${artifactsDir}`);
  log.close();

  process.exitCode = outcome.aborted || failed > 0 ? 1 : 0;
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    printHelp();
    return;
  }

  const config = resolveConfig(parsed.overrides);
  const repo = repoRoot();

  // Scan + classify the dataset (needed for both dry-run and a real run).
  const { datasetRoot, files } = scanDataset(config.datasetRoot);
  const uploadable = files.filter((f) => f.destination !== 'Excluded');

  if (parsed.dryRun) {
    printDryRun(files, config.modules);
    return;
  }

  // --- artifacts / logging (shared by all real runs) ---
  const artifactsDir = path.isAbsolute(config.artifactsDir)
    ? config.artifactsDir
    : path.resolve(uploaderRoot(), config.artifactsDir);
  fs.mkdirSync(artifactsDir, { recursive: true });

  // --- Test Mode / Batch Mode: safe, limited validation runs ---
  if (parsed.testFile !== undefined || parsed.batchSize !== undefined) {
    await runValidation(parsed, config, uploadable, artifactsDir, datasetRoot, repo);
    return;
  }

  // --- Full run ---
  const log = new Logger(path.join(artifactsDir, 'upload.log.jsonl'));
  log.info(`Dataset: ${datasetRoot}`);
  log.info(`Discovered ${files.length} file(s); ${uploadable.length} uploadable, ${files.length - uploadable.length} excluded.`);
  log.info(`Modules: ${config.modules.join(', ')}`);
  log.info(`Resume: ${parsed.resume ? 'on' : 'off'} | Headless: ${config.headless}`);

  const progressPath = path.join(artifactsDir, 'progress.json');
  const progress = new ProgressStore(progressPath, datasetRoot, config.project.name);
  progress.seed(uploadable);

  const startedAtIso = new Date().toISOString();
  let outcome: RunOutcome;
  try {
    // Lazy import so --dry-run never needs Playwright installed.
    const { Uploader } = await import('./uploader.js');
    const uploader = new Uploader({ config, log, progress, artifactsDir, resume: parsed.resume, interactive: parsed.interactive });
    outcome = await uploader.run(uploadable);
  } catch (err) {
    log.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
    outcome = {
      uploaded: progress.counts().uploaded,
      failed: progress.counts().failed,
      skipped: progress.counts().skipped,
      retries: 0,
      durationMs: Date.now() - Date.parse(startedAtIso),
      validations: [],
    };
  }
  const finishedAtIso = new Date().toISOString();

  const reportPath = writeReport(
    { config, progress, outcome, startedAtIso, finishedAtIso },
    repo,
  );

  log.info('─'.repeat(48));
  log.success(`Uploaded ${outcome.uploaded} | Skipped ${outcome.skipped} | Failed ${outcome.failed} | Retries ${outcome.retries}`);
  log.info(`Report:   ${reportPath}`);
  log.info(`Progress: ${progressPath}`);
  log.info(`Artifacts: ${artifactsDir}`);
  log.close();

  process.exitCode = outcome.failed > 0 ? 1 : 0;
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
