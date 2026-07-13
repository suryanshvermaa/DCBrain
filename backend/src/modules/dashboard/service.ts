import { Role, DocumentStatus, ScheduleImportStatus } from '@prisma/client';
import { assertProjectAccess } from '@/modules/projects';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';

// ---------------------------------------------------------------------------
// Actor type
// ---------------------------------------------------------------------------

export interface DashboardActor {
  id: string;
  role: Role;
}

// ---------------------------------------------------------------------------
// Response DTO
// ---------------------------------------------------------------------------

export interface ActivityFeedItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  userName: string;
}

export interface DashboardSummary {
  projectId: string;
  healthScore: number; // 0–100 composite
  documents: {
    total: number;
    processed: number;
    queued: number;
    failed: number;
    byCategory: Record<string, number>;
  };
  compliance: {
    score: number;
    totalFindings: number;
    criticalFindings: number;
    warningFindings: number;
    lastCheckedAt: string | null;
  };
  schedule: {
    totalActivities: number;
    highRiskCount: number;
    criticalPathCount: number;
    spi: number;
    overallRiskScore: number;
    lastImportedAt: string | null;
  };
  procurement: {
    totalItems: number;
    vendorsCount: number;
    atRiskCount: number;
    delayedCount: number;
    overallPerformance: number; // 0-100 average vendor score
  };
  recentActivity: ActivityFeedItem[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const CACHE_TTL_SECONDS = 300; // 5 minutes

function cacheKey(projectId: string): string {
  return `dashboard:summary:${projectId}`;
}

// ---------------------------------------------------------------------------
// Health score weights (must sum to 100)
// ---------------------------------------------------------------------------
// 40 % document processing health
// 30 % compliance score
// 30 % schedule health (inverse of overall risk score)
// ---------------------------------------------------------------------------

function computeHealthScore(
  docProcessRate: number,  // 0–1
  complianceScore: number, // 0–100
  scheduleRisk: number,    // 0–100 (higher = worse)
): number {
  const docHealth    = Math.round(docProcessRate * 100);
  const schedHealth  = Math.max(0, 100 - scheduleRisk);
  return Math.round(0.4 * docHealth + 0.3 * complianceScore + 0.3 * schedHealth);
}

// ---------------------------------------------------------------------------
// Main service function
// ---------------------------------------------------------------------------

export async function getDashboardSummary(input: {
  projectId: string;
  actor: DashboardActor;
  forceRefresh?: boolean;
}): Promise<DashboardSummary> {
  await assertProjectAccess(input.projectId, input.actor);

  const key = cacheKey(input.projectId);

  // --- Try cache first ---
  if (!input.forceRefresh) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        logger.debug('Dashboard summary cache hit', { projectId: input.projectId });
        return JSON.parse(cached) as DashboardSummary;
      }
    } catch (err) {
      logger.warn('Redis get failed — proceeding without cache', { error: (err as Error).message });
    }
  }

  logger.info('Building dashboard summary', { projectId: input.projectId });

  // -------------------------------------------------------------------------
  // 1. Document statistics
  // -------------------------------------------------------------------------
  const documents = await prisma.document.findMany({
    where: { projectId: input.projectId, deletedAt: null },
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

  const docProcessRate = docStats.total > 0 ? docStats.processed / docStats.total : 1;

  // -------------------------------------------------------------------------
  // 2. Compliance summary
  // -------------------------------------------------------------------------
  const complianceCheck = await (prisma as typeof prisma & {
    complianceCheck: {
      findFirst: (args: unknown) => Promise<{
        id: string;
        complianceScore: number;
        summary: unknown;
        createdAt: Date;
      } | null>;
    };
  }).complianceCheck.findFirst({
    where: { projectId: input.projectId },
    orderBy: { createdAt: 'desc' },
    select: { complianceScore: true, summary: true, createdAt: true },
  });

  const complianceSummaryData = (
    complianceCheck?.summary as
      | { totalFindings?: number; failedFindings?: number; warningFindings?: number }
      | null
  ) ?? {};

  const complianceStats = {
    score: complianceCheck?.complianceScore ?? 0,
    totalFindings: complianceSummaryData.totalFindings ?? 0,
    criticalFindings: complianceSummaryData.failedFindings ?? 0,
    warningFindings: complianceSummaryData.warningFindings ?? 0,
    lastCheckedAt: complianceCheck?.createdAt.toISOString() ?? null,
  };

  // -------------------------------------------------------------------------
  // 3. Schedule risk summary
  // -------------------------------------------------------------------------
  const latestImport = await prisma.scheduleImport.findFirst({
    where: { projectId: input.projectId, status: ScheduleImportStatus.SUCCESS },
    orderBy: { importedAt: 'desc' },
    select: { id: true, importedAt: true, activityCount: true },
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
        ? Math.round(
            activities.reduce((sum, a) => sum + a.riskScore, 0) / activities.length
          )
        : 0;
    scheduleStats.lastImportedAt = latestImport.importedAt.toISOString();

    // Rough SPI: if >30 % of critical path activities are high risk → SPI < 1
    if (scheduleStats.criticalPathCount > 0) {
      const criticalHighRisk = activities.filter(
        (a) => a.isCritical && (a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL')
      ).length;
      const criticalRiskRatio = criticalHighRisk / scheduleStats.criticalPathCount;
      scheduleStats.spi = Math.max(0.5, parseFloat((1 - criticalRiskRatio * 0.5).toFixed(2)));
    }
  }

  // -------------------------------------------------------------------------
  // 3.5. Procurement summary
  // -------------------------------------------------------------------------
  const procurementItems = await prisma.procurementItem.findMany({
    where: { projectId: input.projectId },
    select: { status: true, requiredOnSiteDate: true, promisedDate: true }
  });
  const vendors = await prisma.vendor.findMany({
    where: { projectId: input.projectId },
    select: { overallScore: true }
  });

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const procurementStats = {
    totalItems: procurementItems.length,
    vendorsCount: vendors.length,
    atRiskCount: procurementItems.filter(i => 
      (i.status !== 'RECEIVED' && i.status !== 'INSTALLED') &&
      i.requiredOnSiteDate &&
      new Date(i.requiredOnSiteDate) <= thirtyDaysFromNow
    ).length,
    delayedCount: procurementItems.filter(i =>
      (i.status !== 'RECEIVED' && i.status !== 'INSTALLED') &&
      i.promisedDate &&
      new Date(i.promisedDate) < now
    ).length,
    overallPerformance: vendors.length > 0 
      ? Math.round(vendors.reduce((sum, v) => sum + v.overallScore, 0) / vendors.length)
      : 100
  };

  // -------------------------------------------------------------------------
  // 4. Recent activity feed (last 20)
  // -------------------------------------------------------------------------
  const recentActivities = await prisma.activity.findMany({
    where: { projectId: input.projectId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  const activityFeed: ActivityFeedItem[] = recentActivities.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    createdAt: a.createdAt.toISOString(),
    userName: `${a.user.firstName} ${a.user.lastName}`,
  }));

  // -------------------------------------------------------------------------
  // 5. Composite health score
  // -------------------------------------------------------------------------
  const healthScore = computeHealthScore(
    docProcessRate,
    complianceStats.score,
    scheduleStats.overallRiskScore,
  );

  // -------------------------------------------------------------------------
  // Build and cache the result
  // -------------------------------------------------------------------------
  const summary: DashboardSummary = {
    projectId: input.projectId,
    healthScore,
    documents: docStats,
    compliance: complianceStats,
    schedule: scheduleStats,
    procurement: procurementStats,
    recentActivity: activityFeed,
    generatedAt: new Date().toISOString(),
  };

  try {
    await redis.set(key, JSON.stringify(summary), 'EX', CACHE_TTL_SECONDS);
  } catch (err) {
    logger.warn('Redis set failed — dashboard not cached', { error: (err as Error).message });
  }

  return summary;
}
