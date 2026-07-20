import { RiskLevel } from '@prisma/client';
import type { ParsedActivity } from './parser';

export interface ScoredActivity extends ParsedActivity {
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface ScheduleHealthIndicators {
  totalActivities: number;
  criticalPathCount: number;
  highRiskCount: number;
  /** Schedule Performance Index proxy: 1.0 = on schedule, < 1.0 = behind */
  spi: number;
  /** Average float consumption rate across all activities (0–1) */
  floatConsumptionRate: number;
  /** Predicted project completion date (ISO string) or null */
  predictedCompletionDate: string | null;
  /** Overall project risk score (weighted average) */
  overallRiskScore: number;
}

/**
 * Assigns a risk score (0–100) and risk level to each parsed activity.
 *
 * Scoring weights:
 *  - Critical path membership:    30 pts
 *  - Float consumption rate:      40 pts  (1 - totalFloat/maxFloat) × 40
 *  - Duration weight (> 20 days): 15 pts
 *  - Overdue (act start > planned): 15 pts
 */
export function scoreActivities(activities: ParsedActivity[]): ScoredActivity[] {
  const maxFloat = activities.reduce((max, a) => Math.max(max, a.totalFloat), 0);
  const now = new Date();

  return activities.map((activity) => {
    let score = 0;

    // Critical path contribution (30 pts)
    if (activity.isCritical) {
      score += 30;
    }

    // Float consumption rate (40 pts)
    if (maxFloat > 0) {
      const floatRatio = Math.min(1, Math.max(0, 1 - activity.totalFloat / maxFloat));
      score += floatRatio * 40;
    } else if (activity.totalFloat <= 0) {
      // All activities at zero float → all get full float contribution
      score += 40;
    }

    // Duration weight — long activities are inherently riskier (15 pts)
    if (activity.durationDays > 20) {
      score += 15;
    } else if (activity.durationDays > 10) {
      score += 8;
    }

    // Overdue detection (15 pts)
    if (activity.plannedStart && !activity.actualStart && activity.plannedStart < now) {
      // Activity was supposed to start but hasn't — high risk
      score += 15;
    } else if (
      activity.actualStart &&
      activity.plannedStart &&
      activity.actualStart > activity.plannedStart
    ) {
      // Started late
      score += 10;
    }

    const finalScore = Math.min(100, Math.round(score));

    return {
      ...activity,
      riskScore: finalScore,
      riskLevel: toRiskLevel(finalScore),
    };
  });
}

function toRiskLevel(score: number): RiskLevel {
  if (score >= 75) return RiskLevel.CRITICAL;
  if (score >= 50) return RiskLevel.HIGH;
  if (score >= 25) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

/**
 * Compute schedule health indicators from a list of scored activities.
 */
export function computeHealthIndicators(activities: ScoredActivity[]): ScheduleHealthIndicators {
  if (activities.length === 0) {
    return {
      totalActivities: 0,
      criticalPathCount: 0,
      highRiskCount: 0,
      spi: 1.0,
      floatConsumptionRate: 0,
      predictedCompletionDate: null,
      overallRiskScore: 0,
    };
  }

  const now = new Date();
  const criticalPathCount = activities.filter((a) => a.isCritical).length;
  const highRiskCount = activities.filter(
    (a) => a.riskLevel === RiskLevel.HIGH || a.riskLevel === RiskLevel.CRITICAL
  ).length;

  // SPI approximation based on percentage of activities started on time
  const started = activities.filter(
    (a) => a.plannedStart !== null && a.plannedStart <= now && a.actualStart !== null
  ).length;
  const shouldHaveStarted = activities.filter(
    (a) => a.plannedStart !== null && a.plannedStart <= now
  ).length;
  const spi = shouldHaveStarted > 0 ? Math.min(1.5, started / shouldHaveStarted) : 1.0;

  // Float consumption rate
  const maxFloat = activities.reduce((m, a) => Math.max(m, a.totalFloat), 0);
  const avgFloat = activities.reduce((s, a) => s + a.totalFloat, 0) / activities.length;
  const floatConsumptionRate =
    maxFloat > 0 ? parseFloat(Math.min(1, 1 - avgFloat / maxFloat).toFixed(3)) : 0;

  // Predicted completion — latest planned finish + risk buffer days
  let latestFinish: Date | null = null;
  for (const a of activities) {
    if (a.plannedFinish && (!latestFinish || a.plannedFinish > latestFinish)) {
      latestFinish = a.plannedFinish;
    }
  }

  let predictedCompletionDate: string | null = null;
  if (latestFinish) {
    const criticalRiskRatio = criticalPathCount / Math.max(1, activities.length);
    // Buffer: up to 30 extra days for fully critical schedules
    const bufferDays = Math.round(criticalRiskRatio * 30);
    const predicted = new Date(latestFinish);
    predicted.setDate(predicted.getDate() + bufferDays);
    predictedCompletionDate = predicted.toISOString();
  }

  const overallRiskScore = Math.round(
    activities.reduce((s, a) => s + a.riskScore, 0) / activities.length
  );

  return {
    totalActivities: activities.length,
    criticalPathCount,
    highRiskCount,
    spi: parseFloat(spi.toFixed(2)),
    floatConsumptionRate,
    predictedCompletionDate,
    overallRiskScore,
  };
}
