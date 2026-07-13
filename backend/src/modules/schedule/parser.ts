import { XMLParser } from 'fast-xml-parser';

export interface ParsedActivity {
  activityId: string;
  name: string;
  wbsCode: string | null;
  wbsName: string | null;
  plannedStart: Date | null;
  plannedFinish: Date | null;
  actualStart: Date | null;
  actualFinish: Date | null;
  /** Total duration in days (converted from P6 hours) */
  durationDays: number;
  /** Total float in days */
  totalFloat: number;
  /** Free float in days */
  freeFloat: number;
  isCritical: boolean;
  predecessors: string[];
}

interface P6Activity {
  activity_id?: string;
  task_name?: string;
  wbs_id?: string;
  target_start_date?: string;
  target_end_date?: string;
  act_start_date?: string;
  act_end_date?: string;
  /** P6 stores duration in hours */
  target_drtn_hr_cnt?: number | string;
  total_float_hr_cnt?: number | string;
  free_float_hr_cnt?: number | string;
  driving_path_flag?: string;
  task_id?: string;
  predecessor_task_id?: string | string[];
}

interface P6XmlDocument {
  APIBusinessObjects?: {
    Activity?: P6Activity | P6Activity[];
    Relationship?: P6Relationship | P6Relationship[];
  };
  xer?: {
    Activity?: P6Activity | P6Activity[];
    Relationship?: P6Relationship | P6Relationship[];
  };
  // Fallback for varied root tags
  [key: string]: unknown;
}

interface P6Relationship {
  predecessor_task_id?: string;
  successor_task_id?: string;
}

const HOURS_PER_DAY = 8; // P6 standard work day = 8 hours

function toFloat(val: number | string | undefined): number {
  if (val === undefined || val === null || val === '') return 0;
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? 0 : n;
}

function parseDate(val: string | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Extract an array from a value that may be a single object or already an array.
 * P6 XML parsers often return a single-element "array" as a plain object.
 */
function toArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/**
 * Recursively searches a parsed XML object for a key that holds activities.
 */
function findActivities(obj: unknown, depth = 0): P6Activity[] {
  if (depth > 6 || obj === null || typeof obj !== 'object') return [];
  const record = obj as Record<string, unknown>;

  for (const key of ['Activity', 'activity', 'ACTIVITY', 'Task', 'task']) {
    if (record[key] !== undefined) {
      return toArray(record[key] as P6Activity | P6Activity[]);
    }
  }

  for (const child of Object.values(record)) {
    if (child && typeof child === 'object') {
      const found = findActivities(child, depth + 1);
      if (found.length > 0) return found;
    }
  }

  return [];
}

/**
 * Recursively searches for Relationship nodes.
 */
function findRelationships(obj: unknown, depth = 0): P6Relationship[] {
  if (depth > 6 || obj === null || typeof obj !== 'object') return [];
  const record = obj as Record<string, unknown>;

  for (const key of ['Relationship', 'relationship', 'RELATIONSHIP']) {
    if (record[key] !== undefined) {
      return toArray(record[key] as P6Relationship | P6Relationship[]);
    }
  }

  for (const child of Object.values(record)) {
    if (child && typeof child === 'object') {
      const found = findRelationships(child, depth + 1);
      if (found.length > 0) return found;
    }
  }

  return [];
}

/**
 * Parse a Primavera P6 XML buffer into a typed activity list.
 *
 * Supports the standard `APIBusinessObjects` root structure.
 * Falls back to a recursive search for Activity nodes to handle
 * non-standard export root element names.
 *
 * @throws Error if the XML is invalid or contains no activities.
 */
export function parseP6Xml(xmlBuffer: Buffer): ParsedActivity[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    allowBooleanAttributes: true,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
    // Tag names containing underscores are common in P6 — preserve them
    transformTagName: (tag: string) => tag,
  });

  let parsed: P6XmlDocument;
  try {
    parsed = parser.parse(xmlBuffer.toString('utf-8')) as P6XmlDocument;
  } catch (err) {
    throw new Error(`Failed to parse XML: ${err instanceof Error ? err.message : String(err)}`);
  }

  const rawActivities = findActivities(parsed);
  if (rawActivities.length === 0) {
    throw new Error('No Activity nodes found in the uploaded XML. Ensure this is a valid P6 XML export.');
  }

  const relationships = findRelationships(parsed);

  // Build predecessor map: successorId → [predecessorId, ...]
  const predecessorMap = new Map<string, string[]>();
  for (const rel of relationships) {
    const succ = rel.successor_task_id ?? '';
    const pred = rel.predecessor_task_id ?? '';
    if (succ && pred) {
      const existing = predecessorMap.get(succ) ?? [];
      existing.push(pred);
      predecessorMap.set(succ, existing);
    }
  }

  const activities: ParsedActivity[] = rawActivities.map((raw) => {
    const taskId = String(raw.task_id ?? raw.activity_id ?? '');
    const activityId = String(raw.activity_id ?? raw.task_id ?? `ACT-${Math.random().toString(36).slice(2, 8)}`);
    const durationHours = toFloat(raw.target_drtn_hr_cnt);
    const totalFloatHours = toFloat(raw.total_float_hr_cnt);
    const freeFloatHours = toFloat(raw.free_float_hr_cnt);

    return {
      activityId,
      name: String(raw.task_name ?? activityId),
      wbsCode: raw.wbs_id ? String(raw.wbs_id) : null,
      wbsName: null,
      plannedStart: parseDate(raw.target_start_date),
      plannedFinish: parseDate(raw.target_end_date),
      actualStart: parseDate(raw.act_start_date),
      actualFinish: parseDate(raw.act_end_date),
      durationDays: parseFloat((durationHours / HOURS_PER_DAY).toFixed(2)),
      totalFloat: parseFloat((totalFloatHours / HOURS_PER_DAY).toFixed(2)),
      freeFloat: parseFloat((freeFloatHours / HOURS_PER_DAY).toFixed(2)),
      isCritical: raw.driving_path_flag === 'Yes' || raw.driving_path_flag === 'true' || totalFloatHours <= 0,
      predecessors: predecessorMap.get(taskId) ?? [],
    };
  });

  return activities;
}
