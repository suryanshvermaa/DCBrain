import type { ReportType, ReportStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Report section data structures
// ---------------------------------------------------------------------------

export interface ReportSectionData {
  title: string;
  content: string;
  aiSummary?: string;
}

export interface DocumentSectionData {
  total: number;
  processed: number;
  queued: number;
  failed: number;
  byCategory: Record<string, number>;
}

export interface ComplianceSectionData {
  score: number;
  totalFindings: number;
  criticalFindings: number;
  warningFindings: number;
  lastCheckedAt: string | null;
}

export interface ScheduleSectionData {
  totalActivities: number;
  highRiskCount: number;
  criticalPathCount: number;
  spi: number;
  overallRiskScore: number;
  lastImportedAt: string | null;
}

export interface ProcurementSectionData {
  totalItems: number;
  vendorsCount: number;
  atRiskCount: number;
  delayedCount: number;
  overallPerformance: number;
  topDelayedItems: Array<{ material: string; vendor: string | null; status: string }>;
}

export interface RfiSectionData {
  total: number;
  open: number;
  overdue: number;
}

export interface ReportData {
  projectId: string;
  projectName: string;
  projectCode: string;
  generatedAt: string;
  reportType: ReportType;
  documents: DocumentSectionData;
  compliance: ComplianceSectionData;
  schedule: ScheduleSectionData;
  procurement: ProcurementSectionData;
  rfis: RfiSectionData;
  healthScore: number;
}

// ---------------------------------------------------------------------------
// API types
// ---------------------------------------------------------------------------

export interface GenerateReportInput {
  projectId: string;
  type: ReportType;
  userId?: string;
  runAsync?: boolean;
}

export interface ReportListItem {
  id: string;
  type: ReportType;
  title: string;
  status: ReportStatus;
  fileSizeBytes: number | null;
  generatedAt: string | null;
  createdAt: string;
  generatedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface ReportDetail extends ReportListItem {
  markdownContent: string | null;
  storageKey: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
}
