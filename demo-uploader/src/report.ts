/**
 * UPLOAD_REPORT.md generator — renders the final run outcome (from the progress
 * store + the run's validation records) into a human-readable Markdown report at
 * the repo root.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { UploadConfig } from './config.js';
import type { ProgressStore } from './progress.js';
import type { RunOutcome, ValidationRecord } from './uploader.js';
import type { ModuleName, ProgressRecord } from './types.js';

export interface ReportInput {
  config: UploadConfig;
  progress: ProgressStore;
  outcome: RunOutcome;
  startedAtIso: string;
  finishedAtIso: string;
}

const MODULES: ModuleName[] = ['Documents', 'Procurement', 'Schedule Risk'];

export function renderReport(input: ReportInput): string {
  const { config, progress, outcome, startedAtIso, finishedAtIso } = input;
  const records = progress.all();
  const counts = progress.counts();

  const lines: string[] = [];
  lines.push('# DCBrain Demo-Data Upload Report');
  lines.push('');
  lines.push(`_Generated ${finishedAtIso}_`);
  lines.push('');
  lines.push('## Run summary');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Project | ${config.project.name} (${config.project.code}) |`);
  lines.push(`| Base URL | ${config.baseUrl} |`);
  lines.push(`| Browser | ${config.browser}${config.headless ? ' (headless)' : ''} |`);
  lines.push(`| Started | ${startedAtIso} |`);
  lines.push(`| Finished | ${finishedAtIso} |`);
  lines.push(`| Duration | ${formatDuration(outcome.durationMs)} |`);
  lines.push(`| Retries used | ${outcome.retries} |`);
  if (outcome.videoPath) lines.push(`| Video | ${outcome.videoPath} |`);
  lines.push('');

  lines.push('## Totals');
  lines.push('');
  lines.push('| Status | Files |');
  lines.push('| --- | --- |');
  lines.push(`| ✅ Uploaded | ${counts.uploaded} |`);
  lines.push(`| ⏭️ Skipped (resume / duplicate) | ${counts.skipped} |`);
  lines.push(`| ❌ Failed | ${counts.failed} |`);
  lines.push(`| ⏳ Pending (never attempted) | ${counts.pending} |`);
  lines.push(`| **Total tracked** | **${records.length}** |`);
  lines.push('');

  lines.push('## Per-module breakdown');
  lines.push('');
  lines.push('| Module | Uploaded | Skipped | Failed | Pending |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const m of MODULES) {
    const inMod = records.filter((r) => r.destination === m);
    lines.push(
      `| ${m} | ${byStatus(inMod, 'uploaded')} | ${byStatus(inMod, 'skipped')} | ${byStatus(inMod, 'failed')} | ${byStatus(inMod, 'pending')} |`,
    );
  }
  lines.push('');

  // Validations
  lines.push('## UI validations');
  lines.push('');
  if (outcome.validations.length === 0) {
    lines.push('_No validation records captured (dry run or no uploads)._');
  } else {
    lines.push('| Result | Module | Unit | Detail |');
    lines.push('| --- | --- | --- | --- |');
    for (const v of outcome.validations) {
      lines.push(`| ${v.ok ? '✅' : '⚠️'} | ${v.module} | ${escapePipes(v.unit)} | ${escapePipes(v.detail)} |`);
    }
  }
  lines.push('');

  // Failures
  const failures = records.filter((r) => r.status === 'failed');
  lines.push('## Failures');
  lines.push('');
  if (failures.length === 0) {
    lines.push('None. 🎉');
  } else {
    lines.push('| File | Module | Attempts | Last error |');
    lines.push('| --- | --- | --- | --- |');
    for (const f of failures) {
      lines.push(`| \`${f.relPath}\` | ${f.destination} | ${f.attempts} | ${escapePipes(f.lastError ?? '')} |`);
    }
  }
  lines.push('');

  lines.push('## Integrity');
  lines.push('');
  const withChecksum = records.filter((r) => r.checksum).length;
  lines.push(`- Files with a recorded sha256 checksum: **${withChecksum} / ${records.length}**`);
  lines.push('- Checksums are recorded at upload time and re-used for duplicate detection on subsequent runs.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('_This report is produced entirely from UI-driven uploads; no backend API or database was written to directly._');
  lines.push('');

  return lines.join('\n');
}

export function writeReport(input: ReportInput, repoRootDir: string): string {
  const md = renderReport(input);
  const outPath = path.join(repoRootDir, 'UPLOAD_REPORT.md');
  fs.writeFileSync(outPath, md);
  return outPath;
}

function byStatus(records: ProgressRecord[], status: ProgressRecord['status']): number {
  return records.filter((r) => r.status === status).length;
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

export type { ValidationRecord };
