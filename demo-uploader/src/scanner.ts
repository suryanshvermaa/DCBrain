/**
 * Recursively scans the dataset root and classifies every file exactly once.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { classifyFile } from './classifier.js';
import type { ClassifiedFile } from './types.js';

/** Directory of this source file (cross-platform, safe on Windows). */
const HERE = path.dirname(fileURLToPath(import.meta.url));

/** demo-uploader/ directory. */
export function uploaderRoot(): string {
  return path.resolve(HERE, '..');
}

/** Repo root = parent of demo-uploader/. Used to build stable repo-relative keys. */
export function repoRoot(): string {
  return path.resolve(HERE, '..', '..');
}

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
}

export interface ScanResult {
  datasetRoot: string;
  files: ClassifiedFile[];
}

/**
 * Scan + classify. `datasetRoot` may be relative to the repo root.
 */
export function scanDataset(datasetRootInput: string): ScanResult {
  const root = repoRoot();
  // Resolve relative dataset paths against the demo-uploader/ directory
  // (matches how the config expresses it, e.g. "../project-data").
  const finalRoot = path.isAbsolute(datasetRootInput)
    ? datasetRootInput
    : path.resolve(uploaderRoot(), datasetRootInput);

  if (!fs.existsSync(finalRoot)) {
    throw new Error(`Dataset root not found: ${finalRoot} (from "${datasetRootInput}")`);
  }

  const absFiles: string[] = [];
  walk(finalRoot, absFiles);
  absFiles.sort((a, b) => a.localeCompare(b));

  const files = absFiles.map((absPath) => {
    const relPath = path.relative(root, absPath);
    const relFromDataset = path.relative(finalRoot, absPath);
    const sizeBytes = safeSize(absPath);
    return classifyFile({ absPath, relPath, relFromDataset, sizeBytes });
  });

  return { datasetRoot: finalRoot, files };
}

function safeSize(p: string): number {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
}

/** sha256 checksum of a file's contents (integrity + duplicate detection). */
export function checksum(absPath: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(absPath));
  return hash.digest('hex');
}
