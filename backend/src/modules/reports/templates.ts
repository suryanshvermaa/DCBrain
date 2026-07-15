import { ReportType, DocumentStatus, ScheduleImportStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { askGemini } from '@/modules/agents/llm';
import { logger } from '@/lib/logger';
import type { ReportData, ReportSectionData } from './types';

// ---------------------------------------------------------------------------
// Template metadata
// ---------------------------------------------------------------------------

interface TemplateConfig {
  type: ReportType;
  title: string;
  sections: Array<'executive' | 'documents' | 'compliance' | 'schedule' | 'procurement' | 'rfis' | 'risks' | 'recommendations'>;
}

const REPORT_TEMPLATES: Record<ReportType, TemplateConfig> = {
  DAILY: {
    type: 'DAILY',
    title: 'Daily Project Status Report',
    sections: ['executive', 'documents', 'compliance', 'schedule', 'procurement', 'rfis'],
  },
  WEEKLY: {
    type: 'WEEKLY',
    title: 'Weekly Project Summary Report',
    sections: ['executive', 'documents', 'compliance', 'schedule', 'procurement', 'rfis', 'risks', 'recommendations'],
  },
  EXECUTIVE: {
    type: 'EXECUTIVE',
    title: 'Executive Briefing Report',
    sections: ['executive', 'compliance', 'schedule', 'procurement', 'risks', 'recommendations'],
  },
  COMPLIANCE: {
    type: 'COMPLIANCE',
    title: 'Compliance Status Report',
    sections: ['executive', 'compliance', 'recommendations'],
  },
  RISK: {
    type: 'RISK',
    title: 'Risk Assessment Report',
    sections: ['executive', 'schedule', 'procurement', 'risks', 'recommendations'],
  },
  PROCUREMENT: {
    type: 'PROCUREMENT',
    title: 'Procurement Status Report',
    sections: ['executive', 'procurement', 'recommendations'],
  },
};

export function getTemplateConfig(type: ReportType): TemplateConfig {
  return REPORT_TEMPLATES[type];
}

// ---------------------------------------------------------------------------
// Data aggregation: collects data from all modules
// ---------------------------------------------------------------------------

export async function aggregateReportData(projectId: string, reportType: ReportType): Promise<ReportData> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { id: true, name: true, code: true },
  });

  // 1. Document statistics
  const documents = await prisma.document.findMany({
    where: { projectId, deletedAt: null },
    select: { status: true, category: true },
  });

  const docStats = {
    total: documents.length,
    processed: documents.filter((d) => d.status === DocumentStatus.PROCESSED).length,
    queued: documents.filter(
      (d) => d.status === DocumentStatus.QUEUED || d.status === DocumentStatus.PROCESSING
    ).length,
    failed: documents.filter((d) => d.status === DocumentStatus.FAILED).length,
    byCategory: {} as Record<string, number>,
  };

  for (const doc of documents) {
    const cat = doc.category ?? 'uncategorized';
    docStats.byCategory[cat] = (docStats.byCategory[cat] ?? 0) + 1;
  }

  // 2. Compliance
  const complianceCheck = await (prisma as typeof prisma & {
    complianceCheck: {
      findFirst: (args: unknown) => Promise<{
        complianceScore: number;
        summary: unknown;
        createdAt: Date;
      } | null>;
    };
  }).complianceCheck.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: { complianceScore: true, summary: true, createdAt: true },
  });

  const compSummary = (
    complianceCheck?.summary as
      | { totalFindings?: number; failedFindings?: number; warningFindings?: number }
      | null
  ) ?? {};

  const complianceStats = {
    score: complianceCheck?.complianceScore ?? 0,
    totalFindings: compSummary.totalFindings ?? 0,
    criticalFindings: compSummary.failedFindings ?? 0,
    warningFindings: compSummary.warningFindings ?? 0,
    lastCheckedAt: complianceCheck?.createdAt.toISOString() ?? null,
  };

  // 3. Schedule
  const latestImport = await prisma.scheduleImport.findFirst({
    where: { projectId, status: ScheduleImportStatus.SUCCESS },
    orderBy: { importedAt: 'desc' },
    select: { id: true, importedAt: true },
  });

  let scheduleStats = {
    totalActivities: 0,
    highRiskCount: 0,
    criticalPathCount: 0,
    spi: 1.0,
    overallRiskScore: 0,
    lastImportedAt: null as string | null,
  };

  if (latestImport) {
    const activities = await prisma.scheduleActivity.findMany({
      where: { importId: latestImport.id },
      select: { riskLevel: true, isCritical: true, riskScore: true },
    });

    scheduleStats.totalActivities = activities.length;
    scheduleStats.highRiskCount = activities.filter(
      (a) => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL'
    ).length;
    scheduleStats.criticalPathCount = activities.filter((a) => a.isCritical).length;
    scheduleStats.overallRiskScore =
      activities.length > 0
        ? Math.round(activities.reduce((sum, a) => sum + a.riskScore, 0) / activities.length)
        : 0;
    scheduleStats.lastImportedAt = latestImport.importedAt.toISOString();

    if (scheduleStats.criticalPathCount > 0) {
      const criticalHighRisk = activities.filter(
        (a) => a.isCritical && (a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL')
      ).length;
      const criticalRiskRatio = criticalHighRisk / scheduleStats.criticalPathCount;
      scheduleStats.spi = Math.max(0.5, parseFloat((1 - criticalRiskRatio * 0.5).toFixed(2)));
    }
  }

  // 4. Procurement
  const procItems = await prisma.procurementItem.findMany({
    where: { projectId },
    select: { status: true, requiredOnSiteDate: true, promisedDate: true, material: true, vendor: { select: { name: true } } },
  });
  const vendors = await prisma.vendor.findMany({
    where: { projectId },
    select: { overallScore: true },
  });

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const delayed = procItems.filter(
    (i) =>
      i.status !== 'RECEIVED' &&
      i.status !== 'INSTALLED' &&
      i.promisedDate &&
      new Date(i.promisedDate) < now
  );

  const procurementStats = {
    totalItems: procItems.length,
    vendorsCount: vendors.length,
    atRiskCount: procItems.filter(
      (i) =>
        i.status !== 'RECEIVED' &&
        i.status !== 'INSTALLED' &&
        i.requiredOnSiteDate &&
        new Date(i.requiredOnSiteDate) <= thirtyDays
    ).length,
    delayedCount: delayed.length,
    overallPerformance:
      vendors.length > 0
        ? Math.round(vendors.reduce((sum, v) => sum + v.overallScore, 0) / vendors.length)
        : 100,
    topDelayedItems: delayed.slice(0, 5).map((d) => ({
      material: d.material,
      vendor: d.vendor?.name ?? null,
      status: d.status,
    })),
  };

  // 5. RFIs
  const rfisList = await prisma.rfi.findMany({
    where: { projectId },
    select: { status: true, dueDate: true },
  });

  const resolvedStatuses = ['ANSWERED', 'CLOSED', 'VOID'];
  const rfiStats = {
    total: rfisList.length,
    open: rfisList.filter((r) => r.status === 'OPEN' || r.status === 'IN_REVIEW').length,
    overdue: rfisList.filter(
      (r) => r.dueDate && !resolvedStatuses.includes(r.status) && new Date(r.dueDate) < now
    ).length,
  };

  // 6. Health score (same formula as dashboard)
  const docProcessRate = docStats.total > 0 ? docStats.processed / docStats.total : 1;
  const docHealth = Math.round(docProcessRate * 100);
  const schedHealth = Math.max(0, 100 - scheduleStats.overallRiskScore);
  const healthScore = Math.round(0.4 * docHealth + 0.3 * complianceStats.score + 0.3 * schedHealth);

  return {
    projectId: project.id,
    projectName: project.name,
    projectCode: project.code,
    generatedAt: now.toISOString(),
    reportType,
    documents: docStats,
    compliance: complianceStats,
    schedule: scheduleStats,
    procurement: procurementStats,
    rfis: rfiStats,
    healthScore,
  };
}

// ---------------------------------------------------------------------------
// Section renderers: data → Markdown
// ---------------------------------------------------------------------------

async function renderExecutiveSummary(data: ReportData): Promise<ReportSectionData> {
  const prompt = `You are the DCBrain Reporting Agent. Generate a concise executive summary (3-4 paragraphs) for a ${data.reportType.toLowerCase()} project report.

Project: ${data.projectName} (${data.projectCode})
Report Date: ${new Date(data.generatedAt).toLocaleDateString()}
Overall Health Score: ${data.healthScore}/100
Document Status: ${data.documents.processed}/${data.documents.total} processed (${data.documents.failed} failed)
Compliance Score: ${data.compliance.score}%
Schedule Risk: ${data.schedule.overallRiskScore}/100, SPI: ${data.schedule.spi}, Critical Path Activities: ${data.schedule.criticalPathCount}
Procurement: ${data.procurement.totalItems} items, ${data.procurement.delayedCount} delayed, ${data.procurement.atRiskCount} at risk
RFIs: ${data.rfis.total} total, ${data.rfis.open} open, ${data.rfis.overdue} overdue

Write a professional executive summary focusing on actionable insights and overall project health. Use markdown formatting.`;

  const aiSummary = await askGemini(prompt);

  return {
    title: 'Executive Summary',
    content: `**Overall Health Score: ${data.healthScore}/100**\n\n${aiSummary}`,
    aiSummary,
  };
}

function renderDocumentSection(data: ReportData): ReportSectionData {
  const categories = Object.entries(data.documents.byCategory)
    .map(([cat, count]) => `| ${cat} | ${count} |`)
    .join('\n');

  const content = `| Metric | Value |
|--------|-------|
| Total Documents | ${data.documents.total} |
| Processed | ${data.documents.processed} |
| Queued / Processing | ${data.documents.queued} |
| Failed | ${data.documents.failed} |

### Documents by Category

| Category | Count |
|----------|-------|
${categories || '| No documents | 0 |'}`;

  return { title: 'Document Ingestion', content };
}

function renderComplianceSection(data: ReportData): ReportSectionData {
  const content = `**Compliance Score: ${data.compliance.score}%**

| Metric | Value |
|--------|-------|
| Total Findings | ${data.compliance.totalFindings} |
| Critical Findings | ${data.compliance.criticalFindings} |
| Warning Findings | ${data.compliance.warningFindings} |
| Last Checked | ${data.compliance.lastCheckedAt ? new Date(data.compliance.lastCheckedAt).toLocaleDateString() : 'Never'} |

${data.compliance.score < 80 ? '> ⚠️ **Compliance score is below 80%.** Immediate review recommended.\n' : '> ✅ Compliance score is within acceptable range.\n'}`;

  return { title: 'Compliance & Standards', content };
}

function renderScheduleSection(data: ReportData): ReportSectionData {
  const content = `**Schedule Performance Index (SPI): ${data.schedule.spi}**

| Metric | Value |
|--------|-------|
| Total Activities | ${data.schedule.totalActivities} |
| Critical Path Activities | ${data.schedule.criticalPathCount} |
| High/Critical Risk Activities | ${data.schedule.highRiskCount} |
| Overall Risk Score | ${data.schedule.overallRiskScore}/100 |
| Last Imported | ${data.schedule.lastImportedAt ? new Date(data.schedule.lastImportedAt).toLocaleDateString() : 'No import'} |

${data.schedule.spi < 0.9 ? '> ⚠️ **SPI below 0.9** — schedule is behind. Mitigation actions required.\n' : '> ✅ Schedule is on track.\n'}`;

  return { title: 'Schedule Risk Analysis', content };
}

function renderProcurementSection(data: ReportData): ReportSectionData {
  const delayedTable = data.procurement.topDelayedItems.length > 0
    ? `### Delayed Items\n\n| Material | Vendor | Status |\n|----------|--------|--------|\n${data.procurement.topDelayedItems.map((i) => `| ${i.material} | ${i.vendor ?? 'N/A'} | ${i.status} |`).join('\n')}`
    : '';

  const content = `**Overall Vendor Performance: ${data.procurement.overallPerformance}/100**

| Metric | Value |
|--------|-------|
| Total Procurement Items | ${data.procurement.totalItems} |
| Active Vendors | ${data.procurement.vendorsCount} |
| At-Risk Items (30 days) | ${data.procurement.atRiskCount} |
| Delayed Items | ${data.procurement.delayedCount} |

${delayedTable}

${data.procurement.delayedCount > 0 ? '> ⚠️ **Delayed procurement items detected.** Vendor follow-up required.\n' : '> ✅ All procurement items are on schedule.\n'}`;

  return { title: 'Procurement Status', content };
}

function renderRfiSection(data: ReportData): ReportSectionData {
  const content = `| Metric | Value |
|--------|-------|
| Total RFIs | ${data.rfis.total} |
| Open | ${data.rfis.open} |
| Overdue | ${data.rfis.overdue} |

${data.rfis.overdue > 0 ? `> ⚠️ **${data.rfis.overdue} overdue RFI(s).** Escalation may be required.\n` : '> ✅ All RFIs are within their due dates.\n'}`;

  return { title: 'Requests for Information (RFIs)', content };
}

async function renderRisksSection(data: ReportData): Promise<ReportSectionData> {
  const prompt = `You are the DCBrain Risk Analyst. Based on the following project data, identify the top 3-5 risks and present them as a numbered list with severity (LOW/MEDIUM/HIGH/CRITICAL), description, and recommended mitigation.

Health Score: ${data.healthScore}/100
Compliance Score: ${data.compliance.score}%, Critical Findings: ${data.compliance.criticalFindings}
Schedule Risk: ${data.schedule.overallRiskScore}/100, SPI: ${data.schedule.spi}, High Risk Activities: ${data.schedule.highRiskCount}
Procurement: ${data.procurement.delayedCount} delayed, ${data.procurement.atRiskCount} at risk
RFIs: ${data.rfis.overdue} overdue

Use markdown formatting with bold severity labels.`;

  const aiSummary = await askGemini(prompt);
  return { title: 'Risk Register', content: aiSummary, aiSummary };
}

async function renderRecommendationsSection(data: ReportData): Promise<ReportSectionData> {
  const prompt = `You are the DCBrain Recommendation Engine. Based on the following project data, provide 3-5 actionable recommendations for the project team. Each recommendation should have a title, rationale, and specific action steps.

Health Score: ${data.healthScore}/100
Failed Documents: ${data.documents.failed}
Compliance Score: ${data.compliance.score}%
Schedule SPI: ${data.schedule.spi}, High Risk: ${data.schedule.highRiskCount}
Procurement Delayed: ${data.procurement.delayedCount}
Overdue RFIs: ${data.rfis.overdue}

Use markdown formatting with headers and bullet points.`;

  const aiSummary = await askGemini(prompt);
  return { title: 'Recommendations', content: aiSummary, aiSummary };
}

// ---------------------------------------------------------------------------
// Section renderer dispatcher
// ---------------------------------------------------------------------------

const SECTION_RENDERERS: Record<string, (data: ReportData) => ReportSectionData | Promise<ReportSectionData>> = {
  executive: renderExecutiveSummary,
  documents: renderDocumentSection,
  compliance: renderComplianceSection,
  schedule: renderScheduleSection,
  procurement: renderProcurementSection,
  rfis: renderRfiSection,
  risks: renderRisksSection,
  recommendations: renderRecommendationsSection,
};

// ---------------------------------------------------------------------------
// Main template renderer: produces full Markdown report
// ---------------------------------------------------------------------------

export async function renderReport(data: ReportData): Promise<string> {
  const template = getTemplateConfig(data.reportType);

  const header = `# ${template.title}

**Project:** ${data.projectName} (${data.projectCode})
**Generated:** ${new Date(data.generatedAt).toLocaleString()}
**Report Type:** ${data.reportType}

---
`;

  const sections: string[] = [header];

  for (const sectionKey of template.sections) {
    const renderer = SECTION_RENDERERS[sectionKey];
    if (!renderer) {
      logger.warn(`Unknown report section: ${sectionKey}`);
      continue;
    }

    try {
      const section = await renderer(data);
      sections.push(`## ${section.title}\n\n${section.content}\n\n---\n`);
    } catch (error) {
      logger.error(`Failed to render section: ${sectionKey}`, { error });
      sections.push(`## ${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}\n\n> ⚠️ Failed to generate this section.\n\n---\n`);
    }
  }

  const footer = `\n*Report generated by DCBrain AI Platform — ${new Date(data.generatedAt).toISOString()}*\n`;
  sections.push(footer);

  return sections.join('\n');
}
