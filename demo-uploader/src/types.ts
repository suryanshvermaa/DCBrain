/** Shared types for the DCBrain demo-data uploader. */

/** The three modules in DCBrain that expose a real UI upload/import control. */
export type ModuleName = 'Documents' | 'Procurement' | 'Schedule Risk';

/** A module a file can be routed to, plus the sentinel for files we intentionally skip. */
export type Destination = ModuleName | 'Excluded';

/** UI route for each module (Next.js App Router path). */
export const MODULE_ROUTES: Record<ModuleName, string> = {
  Documents: '/documents',
  Procurement: '/procurement',
  'Schedule Risk': '/schedule',
};

/**
 * A single discovered dataset file after classification.
 */
export interface ClassifiedFile {
  /** Absolute path on disk. */
  absPath: string;
  /** Path relative to the repo root (used as the stable key in the plan/map/progress). */
  relPath: string;
  /** File name only. */
  fileName: string;
  /** Lower-case extension without the dot (e.g. "pdf"). */
  ext: string;
  /** Size in bytes. */
  sizeBytes: number;
  /** Where this file should be uploaded — or "Excluded". */
  destination: Destination;
  /** UI route the file is uploaded through (undefined for Excluded). */
  page?: string;
  /** Documents category / procurement-or-schedule sub-type — human-readable classification. */
  category: string;
  /** EPC discipline inferred from the folder tree. */
  epcCategory: string;
  /** Short business purpose / document-type description. */
  businessPurpose: string;
  /** How the platform's AI uses this artefact once uploaded. */
  aiUsage: string;
  /** Metadata key/values sent or implied at upload time. */
  metadata: Record<string, string>;
  /** Processing pipeline the file will flow through after upload. */
  pipeline: string;
  /** If destination === 'Excluded', why. */
  excludeReason?: string;
}

/** Per-file progress record persisted for resume + reporting. */
export interface ProgressRecord {
  relPath: string;
  destination: Destination;
  status: 'pending' | 'uploaded' | 'failed' | 'skipped';
  /** sha256 of the file contents at upload time (duplicate / integrity check). */
  checksum?: string;
  attempts: number;
  lastError?: string;
  /** ISO timestamp of the terminal state. */
  updatedAt?: string;
  /** ms the upload unit containing this file took (batch-level, informational). */
  durationMs?: number;
}

export interface ProgressFile {
  /** Identifies the dataset+project this progress belongs to. */
  datasetRoot: string;
  projectName: string;
  startedAt: string;
  updatedAt: string;
  records: Record<string, ProgressRecord>;
}
