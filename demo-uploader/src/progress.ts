/**
 * Resumable progress store. Persists a JSON file mapping each dataset file
 * (by repo-relative path) to its upload status, checksum, attempts and errors.
 *
 * Enables:
 *   • --resume (skip files already 'uploaded')
 *   • duplicate detection (same checksum seen twice)
 *   • upload history + final report figures
 */

import fs from 'node:fs';
import path from 'node:path';
import type { ClassifiedFile, ProgressFile, ProgressRecord } from './types.js';

export class ProgressStore {
  private data: ProgressFile;
  private readonly filePath: string;
  /** checksum -> first relPath that produced it (duplicate detection). */
  private readonly checksums = new Map<string, string>();

  constructor(filePath: string, datasetRoot: string, projectName: string) {
    this.filePath = filePath;
    if (fs.existsSync(filePath)) {
      this.data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as ProgressFile;
      for (const [rel, rec] of Object.entries(this.data.records)) {
        if (rec.checksum) this.checksums.set(rec.checksum, rel);
      }
    } else {
      this.data = {
        datasetRoot,
        projectName,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        records: {},
      };
    }
  }

  /** Seed pending records for any files not already tracked. */
  seed(files: ClassifiedFile[]): void {
    for (const f of files) {
      if (!this.data.records[f.relPath]) {
        this.data.records[f.relPath] = {
          relPath: f.relPath,
          destination: f.destination,
          status: 'pending',
          attempts: 0,
        };
      }
    }
    this.flush();
  }

  get(relPath: string): ProgressRecord | undefined {
    return this.data.records[relPath];
  }

  isUploaded(relPath: string): boolean {
    return this.data.records[relPath]?.status === 'uploaded';
  }

  /** Returns the earlier relPath if this checksum was already uploaded, else null. */
  duplicateOf(checksum: string, selfRelPath: string): string | null {
    const seen = this.checksums.get(checksum);
    return seen && seen !== selfRelPath ? seen : null;
  }

  update(relPath: string, patch: Partial<ProgressRecord>): void {
    const existing = this.data.records[relPath] ?? {
      relPath,
      destination: patch.destination ?? 'Documents',
      status: 'pending',
      attempts: 0,
    };
    const merged: ProgressRecord = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.data.records[relPath] = merged;
    if (merged.checksum) this.checksums.set(merged.checksum, relPath);
    this.flush();
  }

  counts(): Record<ProgressRecord['status'], number> {
    const c: Record<ProgressRecord['status'], number> = { pending: 0, uploaded: 0, failed: 0, skipped: 0 };
    for (const rec of Object.values(this.data.records)) c[rec.status]++;
    return c;
  }

  all(): ProgressRecord[] {
    return Object.values(this.data.records);
  }

  private flush(): void {
    this.data.updatedAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }
}
