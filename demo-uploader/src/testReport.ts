/**
 * TEST_UPLOAD_REPORT.md generator — summarizes a Test/Batch validation run:
 * uploaded files, validation results, retries, rate-limit events, errors, and
 * execution time. Written to the repo root.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { UploadConfig } from './config.js';
import type { ValidationOutcome, FileResult } from './validate.js';

export function renderTestReport(config: UploadConfig, outcome: ValidationOutcome): string {
  const { results } = outcome;
  const ok = results.filter((r) => r.status === 'success');
  const failed = results.filter((r) => r.status === 'failed');
  const aborted = results.filter((r) => r.status === 'aborted');
  const totalRetries = results.reduce((n, r) => n + Math.max(0, r.attempts - 1), 0);

  const L: string[] = [];
  L.push('# DCBrain Test Upload Report');
  L.push('');
  L.push(`_Generated ${outcome.finishedAtIso}_`);
  L.push('');
  L.push(`> Safe validation run in **${outcome.mode.toUpperCase()} mode** — a controlled subset, uploaded one file at a time through the UI, to confirm the uploader is reliable and rate-limit-safe before running the full dataset.`);
  L.push('');

  // Run summary
  L.push('## Run summary');
  L.push('');
  L.push('| Field | Value |');
  L.push('| --- | --- |');
  L.push(`| Mode | ${outcome.mode} |`);
  L.push(`| Project | ${config.project.name} (${config.project.code}) |`);
  L.push(`| Base URL | ${config.baseUrl} |`);
  L.push(`| Browser | ${config.browser}${config.headless ? ' (headless)' : ''} |`);
  L.push(`| Files attempted | ${results.length} |`);
  L.push(`| ✅ Succeeded | ${ok.length} |`);
  L.push(`| ❌ Failed | ${failed.length} |`);
  L.push(`| ⛔ Aborted | ${aborted.length} |`);
  L.push(`| Retries used | ${totalRetries} |`);
  L.push(`| Rate-limit events | ${outcome.totalRateLimitHits} |`);
  L.push(`| Indexing verification | ${config.verifyIndexing ? 'on' : 'off'} |`);
  L.push(`| Inter-upload delay | ${config.uploadDelayMs} ms |`);
  L.push(`| Started | ${outcome.startedAtIso} |`);
  L.push(`| Finished | ${outcome.finishedAtIso} |`);
  L.push(`| Total execution time | ${formatDuration(outcome.durationMs)} |`);
  if (outcome.aborted) L.push(`| Abort reason | ${escapePipes(outcome.abortReason ?? 'unknown')} |`);
  L.push('');

  // Verdict
  L.push('## Verdict');
  L.push('');
  if (outcome.aborted) {
    L.push('⛔ **ABORTED** — a rate limit (or persistent error) stopped the run. Do **not** run the full dataset until this is resolved. See the aborted file below.');
  } else if (failed.length > 0) {
    L.push('⚠️ **FAILURES PRESENT** — some files did not validate. Review the errors before running the full dataset.');
  } else if (ok.length === results.length && results.length > 0) {
    L.push('✅ **ALL CLEAR** — every file uploaded, processed/indexed, and verified through the UI. The uploader is safe to run on the full dataset (mind the configured delays).');
  } else {
    L.push('ℹ️ No files were processed.');
  }
  L.push('');

  // Per-file results
  L.push('## Per-file results');
  L.push('');
  if (results.length === 0) {
    L.push('_No files processed._');
  } else {
    L.push('| Result | Module | File | Category | Indexed | Attempts | RL hits | Time | Detail |');
    L.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const r of results) {
      L.push(
        `| ${verdictIcon(r)} | ${r.module} | \`${escapePipes(r.fileName)}\` | ${escapePipes(r.category)} | ${indexedCell(r)} | ${r.attempts} | ${r.rateLimitHits} | ${formatDuration(r.durationMs)} | ${escapePipes(r.detail)} |`,
      );
    }
  }
  L.push('');

  // Errors detail
  const withErrors = results.filter((r) => r.error);
  L.push('## Errors & rate-limit events');
  L.push('');
  if (withErrors.length === 0 && outcome.totalRateLimitHits === 0) {
    L.push('None. 🎉');
  } else {
    if (outcome.totalRateLimitHits > 0) {
      L.push(`- **${outcome.totalRateLimitHits}** rate-limit signal(s) detected and handled via cooldown+retry (policy: base ${config.rateLimit.cooldownMs}ms, up to ${config.rateLimit.maxRetries} retries, cap ${config.rateLimit.maxCooldownMs}ms).`);
      L.push('');
    }
    if (withErrors.length > 0) {
      L.push('| File | Status | Error |');
      L.push('| --- | --- | --- |');
      for (const r of withErrors) {
        L.push(`| \`${escapePipes(r.fileName)}\` | ${r.status} | ${escapePipes(r.error ?? '')} |`);
      }
    }
  }
  L.push('');

  // Evidence
  L.push('## Evidence (screenshots)');
  L.push('');
  L.push('| File | Success | Failure |');
  L.push('| --- | --- | --- |');
  for (const r of results) {
    L.push(`| \`${escapePipes(r.fileName)}\` | ${shortPath(r.successScreenshot)} | ${shortPath(r.failureScreenshot)} |`);
  }
  L.push('');

  L.push('## Integrity');
  L.push('');
  const withChecksum = results.filter((r) => r.checksum).length;
  L.push(`- Files with a recorded sha256 checksum: **${withChecksum} / ${results.length}**`);
  L.push('- Uploads were performed strictly one at a time (no parallelism), each awaiting processing/indexing before the next began.');
  L.push('');
  L.push('---');
  L.push('');
  L.push('_All uploads were driven through the DCBrain UI; no backend API or database was written to directly._');
  L.push('');

  return L.join('\n');
}

export function writeTestReport(config: UploadConfig, outcome: ValidationOutcome, repoRootDir: string): string {
  const md = renderTestReport(config, outcome);
  const outPath = path.join(repoRootDir, 'TEST_UPLOAD_REPORT.md');
  fs.writeFileSync(outPath, md);
  return outPath;
}

function verdictIcon(r: FileResult): string {
  if (r.status === 'success') return '✅';
  if (r.status === 'aborted') return '⛔';
  return '❌';
}

function indexedCell(r: FileResult): string {
  if (r.indexed === null) return 'n/a';
  return r.indexed ? 'yes' : 'no';
}

function shortPath(p?: string): string {
  if (!p) return '—';
  return `\`${path.basename(p)}\``;
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

function escapePipes(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
