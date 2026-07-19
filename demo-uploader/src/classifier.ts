/**
 * Deterministic file classifier.
 *
 * The routing rules below are derived *entirely* from how DCBrain actually
 * ingests data (verified from source), not from assumptions:
 *
 *   • Schedule Risk  — accepts a single Primavera P6 `.xml` per import
 *     (`/schedule` → POST /schedule/import, field `file`, .xml only).
 *   • Procurement    — accepts a single `.csv`/`.xlsx` whose rows carry a
 *     Material + Vendor column (`/procurement` → POST /procurement/import).
 *   • Documents      — the RAG store; accepts pdf/docx/xlsx/csv/json/xml/txt/md
 *     and images (png/jpg/jpeg/tif/tiff). Everything that is genuine *project
 *     content* but is not a P6 schedule or a procurement import table lands here.
 *   • Excluded       — generator metadata and the AI-evaluation harness. These
 *     are not project documents a user would upload; they describe or grade the
 *     dataset itself. Uploading them would pollute the RAG index.
 *
 * Every file resolves to exactly one destination. No file is dropped silently:
 * exclusions are explicit and reported.
 */

import path from 'node:path';
import type { ClassifiedFile, Destination } from './types.js';
import { MODULE_ROUTES } from './types.js';

/** Extensions the Documents pipeline accepts (mirrors DocumentUploadModal ACCEPTED_FILES). */
export const DOCUMENT_EXTS = new Set([
  'pdf', 'docx', 'xlsx', 'csv', 'json', 'xml', 'png', 'jpg', 'jpeg', 'tif', 'tiff', 'txt', 'md',
]);

/** Image extensions — routed to Documents but flagged for the OCR/vision path. */
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'tif', 'tiff']);

/** Human-readable EPC discipline per top-level dataset folder. */
const EPC_DISCIPLINE: Record<string, string> = {
  '01-project-management': 'Project Management',
  '02-design-engineering': 'Design & Engineering',
  '03-electrical': 'Electrical',
  '04-mechanical-hvac': 'Mechanical / HVAC',
  '05-fire-bms-security': 'Fire, BMS & Security',
  '06-networking-it': 'Networking & IT',
  '07-procurement': 'Procurement',
  '08-quality-commissioning': 'Quality & Commissioning',
  '09-project-controls': 'Project Controls',
  '10-site-evidence': 'Site Evidence',
  '10-site-evidence (1)': 'Site Evidence',
  '11-change-orders': 'Change Orders',
  '12-rfis': 'RFIs',
  '13-compliance': 'Compliance',
  '14-ai-evaluation': 'AI Evaluation',
};

/**
 * Documents category assigned from the top-level discipline folder. These become
 * the free-text `category` on the Documents upload, so downstream filtering and
 * agent context stay coherent.
 */
const DOCUMENTS_CATEGORY: Record<string, string> = {
  '01-project-management': 'Project Management',
  '02-design-engineering': 'Design & Engineering',
  '03-electrical': 'Electrical',
  '04-mechanical-hvac': 'Mechanical & HVAC',
  '05-fire-bms-security': 'Fire, BMS & Security',
  '06-networking-it': 'Networking & IT',
  '07-procurement': 'Procurement',
  '08-quality-commissioning': 'Quality & Commissioning',
  '09-project-controls': 'Project Controls',
  '10-site-evidence': 'Site Evidence',
  '10-site-evidence (1)': 'Site Evidence',
  '11-change-orders': 'Change Orders',
  '12-rfis': 'RFIs',
  '13-compliance': 'Compliance',
};

const normalize = (p: string): string => p.split(path.sep).join('/');

/** First path segment under the dataset root (the discipline folder). */
function topFolder(relFromDataset: string): string {
  return normalize(relFromDataset).split('/')[0] ?? '';
}

/** Second-level segment (the sub-folder), if any. */
function subFolder(relFromDataset: string): string {
  return normalize(relFromDataset).split('/')[1] ?? '';
}

/**
 * Does this procurement tabular file match the importer's expected shape?
 *
 * The importer (`procurement/service.ts`) runs `xlsx.sheet_to_json` on the first
 * sheet and keys each row on a Material/Vendor column. That only works on a
 * *flat, one-line-item-per-row* table whose first row is the header.
 *
 * From the discovered dataset, the two files shaped that way are the flat CSVs
 * `BOQ-IMPORT.csv` and `VENDOR-DELIVERY-TRACKER.csv`. The XLSX registers/trackers
 * carry a banner title row (e.g. "PROCUREMENT DELIVERY TRACKER") in row 1, so
 * `sheet_to_json` reads garbage headers — they are better treated as searchable
 * *documents* and are routed to Documents instead. (The header-name mismatch that
 * still affects the two CSVs is captured in UPLOAD_GAP_ANALYSIS.md.)
 */
function isProcurementImportTable(fileName: string): boolean {
  const n = fileName.toLowerCase();
  return n === 'boq-import.csv' || n === 'vendor-delivery-tracker.csv';
}

interface ClassifyArgs {
  absPath: string;
  /** repo-root-relative path (stable key). */
  relPath: string;
  /** dataset-root-relative path (for folder rules). */
  relFromDataset: string;
  sizeBytes: number;
}

export function classifyFile({ absPath, relPath, relFromDataset, sizeBytes }: ClassifyArgs): ClassifiedFile {
  const fileName = path.basename(relPath);
  const ext = (path.extname(fileName).slice(1) || '').toLowerCase();
  const top = topFolder(relFromDataset);
  const sub = subFolder(relFromDataset);
  const lower = normalize(relFromDataset).toLowerCase();
  const epcCategory = EPC_DISCIPLINE[top] ?? 'Uncategorized';

  const base: Omit<ClassifiedFile, 'destination' | 'category' | 'businessPurpose' | 'aiUsage' | 'metadata' | 'pipeline' | 'page' | 'excludeReason'> = {
    absPath,
    relPath: normalize(relPath),
    fileName,
    ext,
    sizeBytes,
    epcCategory,
  };

  const commonMeta = (): Record<string, string> => ({
    project: 'ORION-DC-P1',
    discipline: epcCategory,
    ...(sub ? { section: sub } : {}),
  });

  // ---------------------------------------------------------------------------
  // 1. EXCLUSIONS — generator metadata & AI-evaluation harness (not user uploads)
  // ---------------------------------------------------------------------------
  const excluded = (reason: string): ClassifiedFile => ({
    ...base,
    destination: 'Excluded' as Destination,
    category: 'Excluded',
    businessPurpose: 'Dataset generation / evaluation artefact — not project content',
    aiUsage: 'Used to build or grade the dataset; never uploaded into the platform',
    metadata: commonMeta(),
    pipeline: 'none',
    excludeReason: reason,
  });

  if (top === '14-ai-evaluation') {
    return excluded('AI-evaluation harness (gold answers, RAG QA, scenarios, config) — grades the platform, not uploadable content');
  }
  if (top.startsWith('extrafiles')) {
    return excluded('Task manifest / validation side-car generated by the dataset tooling');
  }
  if (/^task_manifest.*\.json$/i.test(fileName) || /^task_validation_report.*\.md$/i.test(fileName)) {
    return excluded('Dataset build manifest / validation report — metadata about the dataset, not a project document');
  }
  if (fileName.toLowerCase().endsWith('.ocr-groundtruth.txt')) {
    return excluded('OCR ground-truth transcript paired with a scanned PDF — evaluation reference, not user content');
  }

  // ---------------------------------------------------------------------------
  // 2. SCHEDULE RISK — Primavera P6 XML
  // ---------------------------------------------------------------------------
  if (ext === 'xml' && (top === '09-project-controls' || sub === 'p6-schedules' || lower.includes('schedule'))) {
    return {
      ...base,
      destination: 'Schedule Risk',
      page: MODULE_ROUTES['Schedule Risk'],
      category: 'Primavera P6 Schedule',
      businessPurpose: schedulefilePurpose(fileName),
      aiUsage: 'Parsed into activities; drives critical-path, SPI, risk scoring, delay simulation & Schedule Sentinel agent',
      metadata: {
        ...commonMeta(),
        scheduleType: scheduleType(fileName),
      },
      pipeline: 'schedule/import → P6 XML parse → activity + float + risk computation → schedule DB → agent trigger (schedule_imported)',
    };
  }

  // ---------------------------------------------------------------------------
  // 3. PROCUREMENT — importable line-item tables (csv/xlsx with vendor rows)
  // ---------------------------------------------------------------------------
  if ((ext === 'csv' || ext === 'xlsx') && top === '07-procurement' && isProcurementImportTable(fileName)) {
    return {
      ...base,
      destination: 'Procurement',
      page: MODULE_ROUTES.Procurement,
      category: 'Procurement Import Table',
      businessPurpose: 'Line-item procurement / delivery tracker imported into the procurement pipeline',
      aiUsage: 'Creates procurement items + vendors; feeds vendor scorecards, at-risk alerts & Procurement agent',
      metadata: {
        ...commonMeta(),
        importFormat: ext.toUpperCase(),
      },
      pipeline: 'procurement/import → xlsx/csv parse (Material+Vendor rows) → procurementItem + vendor upsert → agent trigger (procurement_imported)',
    };
  }

  // ---------------------------------------------------------------------------
  // 4. DOCUMENTS — everything else that is genuine project content (RAG store)
  // ---------------------------------------------------------------------------
  if (DOCUMENT_EXTS.has(ext)) {
    const isImage = IMAGE_EXTS.has(ext);
    const category = DOCUMENTS_CATEGORY[top] ?? 'General';
    return {
      ...base,
      destination: 'Documents',
      page: MODULE_ROUTES.Documents,
      category,
      businessPurpose: documentPurpose(top, sub, ext, fileName),
      aiUsage: isImage
        ? 'OCR (Tesseract) → text extraction → chunk → embed (bge-m3) → ChromaDB → RAG search, compliance & agents'
        : 'Text extract → chunk → embed (bge-m3) → ChromaDB → RAG search, compliance, RFI suggestions & agents',
      metadata: {
        ...commonMeta(),
        category,
        docType: isImage ? 'image/scan' : ext,
      },
      pipeline: isImage
        ? 'documents/upload → BullMQ → OCR → chunk → embed → ChromaDB'
        : 'documents/upload → BullMQ → parse/extract → chunk → embed → ChromaDB',
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Fallback — unknown extension. Route to Documents only if the UI accepts it;
  //    otherwise exclude explicitly so nothing is silently mishandled.
  // ---------------------------------------------------------------------------
  return excluded(`Unsupported extension ".${ext}" — no DCBrain upload control accepts it`);
}

function scheduleType(fileName: string): string {
  const n = fileName.toLowerCase();
  if (n.includes('baseline')) return 'Baseline';
  if (n.includes('lookahead')) return 'Lookahead';
  if (n.includes('recovery') || n.includes('whatif')) return 'Recovery / What-if';
  if (n.includes('update')) return 'Progress Update';
  if (n.includes('detailed') || n.includes('working')) return 'Working Schedule';
  return 'Schedule';
}

function schedulefilePurpose(fileName: string): string {
  return `Primavera P6 export (${scheduleType(fileName)}) for critical-path & delay-risk analysis`;
}

function documentPurpose(top: string, sub: string, ext: string, fileName: string): string {
  if (top === '07-procurement') return `Procurement document (${sub || 'general'}) — ${ext.toUpperCase()} record`;
  if (top === '08-quality-commissioning') return `Quality/commissioning record (${sub || 'general'})`;
  if (top === '12-rfis') return 'Request for Information (RFI) document';
  if (top === '13-compliance') return 'Compliance / standards document';
  if (top === '11-change-orders') return 'Change order document';
  if (top.startsWith('10-site-evidence')) return `Site evidence (${sub || 'scan/photo'}) for OCR & visual verification`;
  if (sub) return `${sub} document`;
  return `${fileName} — project document`;
}
