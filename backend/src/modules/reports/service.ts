import { ReportStatus, type ReportType, type Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { uploadBuffer, getPresignedDownloadUrl } from '@/lib/minio';
import { assertProjectAccess } from '@/modules/projects';
import { aggregateReportData, renderReport, getTemplateConfig } from './templates';
import { markdownToPdf } from './pdf';
import { enqueueReportGeneration } from './queue';
import type { ReportListItem, ReportDetail, GenerateReportInput } from './types';

export interface ReportActor {
  id: string;
  role: Role;
}

// ---------------------------------------------------------------------------
// Generate Report (sync or async)
// ---------------------------------------------------------------------------

export async function generateReport(input: GenerateReportInput): Promise<{ reportId: string; status: string; report?: ReportDetail }> {
  // Access check
  if (input.actor) {
    await assertProjectAccess(input.projectId, input.actor);
  } else if (input.userId) {
    await assertProjectAccess(input.projectId, { id: input.userId, role: 'VIEWER' as any });
  }

  const template = getTemplateConfig(input.type);

  // Create pending report record
  const report = await prisma.report.create({
    data: {
      type: input.type,
      title: `${template.title} — ${new Date().toLocaleDateString()}`,
      status: ReportStatus.PENDING,
      projectId: input.projectId,
      generatedById: input.userId || null,
    },
  });

  if (input.runAsync) {
    // Enqueue for background processing
    await enqueueReportGeneration({
      reportId: report.id,
      projectId: input.projectId,
      type: input.type,
      userId: input.userId,
    });

    return { reportId: report.id, status: 'PENDING' };
  }

  // Synchronous generation
  const detail = await executeReportGeneration(report.id, input.projectId, input.type, input.userId);
  return { reportId: report.id, status: 'COMPLETED', report: detail };
}

// ---------------------------------------------------------------------------
// Core generation logic (called sync or from worker)
// ---------------------------------------------------------------------------

export async function executeReportGeneration(
  reportId: string,
  projectId: string,
  type: ReportType,
  userId?: string,
): Promise<ReportDetail> {
  logger.info('Starting report generation', { reportId, projectId, type });

  await prisma.report.update({
    where: { id: reportId },
    data: { status: ReportStatus.GENERATING },
  });

  try {
    // 1. Aggregate data from all modules
    const data = await aggregateReportData(projectId, type);

    // 2. Render Markdown
    const markdown = await renderReport(data);

    // 3. Generate PDF
    const pdfBuffer = await markdownToPdf(markdown, {
      title: getTemplateConfig(type).title,
      projectName: data.projectName,
      generatedAt: data.generatedAt,
    });

    // 4. Upload PDF to MinIO
    const storageKey = `projects/${projectId}/reports/${reportId}.pdf`;
    await uploadBuffer(storageKey, pdfBuffer, {
      'Content-Type': 'application/pdf',
      'X-Report-Type': type,
    });

    // 5. Update report record
    const now = new Date();
    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.COMPLETED,
        markdownContent: markdown,
        storageKey,
        fileSizeBytes: pdfBuffer.length,
        generatedAt: now,
        metadata: {
          healthScore: data.healthScore,
          sectionCount: getTemplateConfig(type).sections.length,
          pdfSizeBytes: pdfBuffer.length,
          markdownLength: markdown.length,
        },
      },
      include: {
        generatedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info('Report generation completed', { reportId, type, sizeBytes: pdfBuffer.length });

    return formatReportDetail(updated);
  } catch (error: any) {
    logger.error('Report generation failed', { reportId, error: error.message });

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.FAILED,
        error: error.message || 'Unknown error during report generation',
      },
    });

    throw error;
  }
}

// ---------------------------------------------------------------------------
// List Reports
// ---------------------------------------------------------------------------

export async function listReports(
  projectId: string,
  options: { type?: ReportType; page?: number; pageSize?: number } = {},
): Promise<{ reports: ReportListItem[]; total: number; page: number; pageSize: number }> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: any = { projectId };
  if (options.type) {
    where.type = options.type;
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        generatedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return {
    reports: reports.map(formatReportListItem),
    total,
    page,
    pageSize,
  };
}

// ---------------------------------------------------------------------------
// Get Report Detail
// ---------------------------------------------------------------------------

export async function getReportDetail(reportId: string, projectId: string): Promise<ReportDetail | null> {
  const report = await prisma.report.findFirst({
    where: { id: reportId, projectId },
    include: {
      generatedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!report) return null;
  return formatReportDetail(report);
}

// ---------------------------------------------------------------------------
// Get Download URL
// ---------------------------------------------------------------------------

export async function getReportDownloadUrl(
  reportId: string,
  projectId: string,
  format: 'pdf' | 'md',
): Promise<{ url?: string; markdown?: string; filename: string } | null> {
  const report = await prisma.report.findFirst({
    where: { id: reportId, projectId },
    select: { id: true, title: true, status: true, storageKey: true, markdownContent: true, type: true },
  });

  if (!report || report.status !== 'COMPLETED') return null;

  const safeTitle = report.title.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (format === 'md') {
    return {
      markdown: report.markdownContent ?? '',
      filename: `${safeTitle}.md`,
    };
  }

  if (!report.storageKey) return null;

  let url = await getPresignedDownloadUrl(report.storageKey, 3600);
  
  if (process.env.APP_ENV === 'development') {
    url = url.replace('http://minio:9000', 'http://localhost:9000');
  }

  return {
    url,
    filename: `${safeTitle}.pdf`,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatReportListItem(report: any): ReportListItem {
  return {
    id: report.id,
    type: report.type,
    title: report.title,
    status: report.status,
    fileSizeBytes: report.fileSizeBytes,
    generatedAt: report.generatedAt?.toISOString() ?? null,
    createdAt: report.createdAt.toISOString(),
    generatedBy: report.generatedBy ?? null,
  };
}

function formatReportDetail(report: any): ReportDetail {
  return {
    ...formatReportListItem(report),
    markdownContent: report.markdownContent ?? null,
    storageKey: report.storageKey ?? null,
    error: report.error ?? null,
    metadata: report.metadata ?? null,
  };
}
