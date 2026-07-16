// @ts-nocheck
import { prisma } from '@/lib/prisma';
import { BaseAgentImpl } from './base.agent';
import type { AgentType, AgentInput, AgentContext, AgentOutput, AgentFinding } from './agent.types';
import { askGemini } from './llm';
import { runComplianceCheck } from '@/modules/compliance/service';

// Helper to safely parse JSON from Gemini response
function safeParseJson<T>(jsonStr: string, fallback: T): T {
  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error('Error parsing JSON from Gemini, raw string:', jsonStr);
    return fallback;
  }
}

// =============================================================================
// 1. Document Agent
// =============================================================================
export class DocumentAgent extends BaseAgentImpl {
  readonly type: AgentType = 'DOCUMENT';
  readonly name = 'Document Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const documents = await prisma.document.findMany({
      where: { projectId: input.projectId, deletedAt: null },
      orderBy: { uploadedAt: 'desc' },
    });

    const queuedCount = documents.filter((d) => d.status === 'QUEUED').length;
    const processingCount = documents.filter((d) => d.status === 'PROCESSING').length;
    const processedCount = documents.filter((d) => d.status === 'PROCESSED').length;
    const failedCount = documents.filter((d) => d.status === 'FAILED').length;

    // Detect duplicate names
    const seenNames = new Set<string>();
    const duplicateNames: string[] = [];
    for (const doc of documents) {
      if (seenNames.has(doc.originalName)) {
        duplicateNames.push(doc.originalName);
      }
      seenNames.add(doc.originalName);
    }

    const findings: AgentFinding[] = [];
    if (failedCount > 0) {
      findings.push({
        type: 'ERROR',
        title: 'Document Processing Failures',
        message: `${failedCount} document(s) failed to process. Check OCR or file formatting.`,
        severity: 'high',
        details: { failedCount },
      });
    }
    if (duplicateNames.length > 0) {
      findings.push({
        type: 'WARNING',
        title: 'Duplicate Documents Detected',
        message: `Multiple files with the name "${duplicateNames[0]}" have been uploaded.`,
        severity: 'medium',
        details: { duplicateNames },
      });
    }

    const summaryPrompt = `You are a Document Agent. Here is the metadata breakdown of project documents:
Total Documents: ${documents.length}
Processed: ${processedCount}
Queued: ${queuedCount}
Processing: ${processingCount}
Failed: ${failedCount}
Duplicate names: ${duplicateNames.join(', ') || 'None'}

Provide a 2-sentence summary of the current document ingestion pipeline health.`;

    const summary = await askGemini(summaryPrompt);

    return {
      success: true,
      content: summary,
      confidence: 0.95,
      findings,
      metadata: {
        total: documents.length,
        processed: processedCount,
        queued: queuedCount,
        failed: failedCount,
      },
    };
  }
}

// =============================================================================
// 2. Knowledge Agent
// =============================================================================
export class KnowledgeAgent extends BaseAgentImpl {
  readonly type: AgentType = 'KNOWLEDGE';
  readonly name = 'Knowledge Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const userQuery = input.query || 'What is the current project status?';
    
    // We fetch some document chunks from Prisma to construct context
    const chunks = await prisma.documentChunk.findMany({
      where: { document: { projectId: input.projectId, deletedAt: null } },
      take: 10,
      select: {
        content: true,
        document: { select: { originalName: true } },
      },
    });

    const context = chunks.map((c) => `Document: ${c.document.originalName}\nContent: ${c.content}`).join('\n\n');

    const prompt = `You are the Knowledge Agent. Use the provided context documents to answer the query.
Context:
${context || 'No documents uploaded yet.'}

Query: ${userQuery}

Cite your sources. If context is empty, respond based on general EPC knowledge but warn that no local documents were matched.`;

    const answer = await askGemini(prompt);

    return {
      success: true,
      content: answer,
      confidence: context ? 0.85 : 0.4,
      sources: chunks.map((c) => ({ docName: c.document.originalName, content: c.content })),
    };
  }
}

// =============================================================================
// 3. Compliance Agent
// =============================================================================
export class ComplianceAgent extends BaseAgentImpl {
  readonly type: AgentType = 'COMPLIANCE';
  readonly name = 'Compliance Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const result = await runComplianceCheck({
      projectId: input.projectId,
      actor: { id: ctx.userId || 'system', role: 'ENGINEER' },
      documentIds: input.documentIds,
      standards: input.standards,
      notes: input.notes,
    });

    const findings: AgentFinding[] = result.findings.map((f) => ({
      type: f.status === 'PASS' ? 'SUCCESS' : f.status === 'FAIL' ? 'ERROR' : 'WARNING',
      title: `${f.standard}: ${f.requirement.slice(0, 50)}...`,
      message: `${f.evidence}\nRecommendation: ${f.recommendation}`,
      severity: f.severity === 'critical' ? 'critical' : f.severity === 'major' ? 'high' : 'medium',
      details: f,
    }));

    return {
      success: true,
      content: `Compliance Check executed. Score: ${result.complianceScore}%. Total findings: ${result.summary.totalFindings}.`,
      confidence: 0.9,
      findings,
      metadata: {
        score: result.complianceScore,
        summary: result.summary,
      },
    };
  }
}

// =============================================================================
// 4. Schedule Risk Agent
// =============================================================================
export class ScheduleRiskAgent extends BaseAgentImpl {
  readonly type: AgentType = 'SCHEDULE_RISK';
  readonly name = 'Schedule Risk Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const activities = await prisma.scheduleActivity.findMany({
      where: { projectId: input.projectId },
    });

    if (activities.length === 0) {
      return {
        success: true,
        content: 'No schedule activities have been imported yet.',
        confidence: 0.5,
        findings: [
          {
            type: 'WARNING',
            title: 'Schedule Data Missing',
            message: 'No activities found. Please import a Primavera P6 XML schedule.',
            severity: 'medium',
          },
        ],
      };
    }

    const criticalCount = activities.filter((a) => a.isCritical).length;
    const highRisk = activities.filter((a) => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL');
    const averageRisk = activities.reduce((acc, a) => acc + a.riskScore, 0) / activities.length;

    const findings: AgentFinding[] = [];
    if (highRisk.length > 0) {
      findings.push({
        type: 'ERROR',
        title: 'High Delay-Risk Activities',
        message: `${highRisk.length} activities are flagged as HIGH/CRITICAL delay risk.`,
        severity: 'high',
        details: { count: highRisk.length, topRisk: highRisk.slice(0, 3).map((a) => a.name) },
      });
    }

    const prompt = `You are a Schedule Risk Agent. Synthesize this schedule summary:
Total Activities: ${activities.length}
Critical Path Activities: ${criticalCount}
Average Risk Score: ${averageRisk.toFixed(1)} / 100
High Risk Activities Count: ${highRisk.length}

Provide a concise 2-sentence summary of the schedule risks.`;

    const summary = await askGemini(prompt);

    return {
      success: true,
      content: summary,
      confidence: 0.9,
      findings,
      metadata: {
        totalActivities: activities.length,
        criticalPathCount: criticalCount,
        averageRiskScore: averageRisk,
        highRiskCount: highRisk.length,
      },
    };
  }
}

// =============================================================================
// 5. Procurement Agent
// =============================================================================
export class ProcurementAgent extends BaseAgentImpl {
  readonly type: AgentType = 'PROCUREMENT';
  readonly name = 'Procurement Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const items = await prisma.procurementItem.findMany({
      where: { projectId: input.projectId },
      include: { vendor: true },
    });

    if (items.length === 0) {
      return {
        success: true,
        content: 'No procurement tracking data found.',
        confidence: 0.5,
      };
    }

    const delayed = items.filter(
      (item) =>
        item.status !== 'RECEIVED' &&
        item.status !== 'INSTALLED' &&
        item.requiredOnSiteDate &&
        new Date(item.requiredOnSiteDate) < new Date()
    );

    const findings: AgentFinding[] = [];
    if (delayed.length > 0) {
      findings.push({
        type: 'ERROR',
        title: 'Delayed Procurement Items',
        message: `${delayed.length} items are past their Required-On-Site Date but not received.`,
        severity: 'critical',
        details: { count: delayed.length, items: delayed.slice(0, 3).map((d) => d.material) },
      });
    }

    const prompt = `You are a Procurement Agent. Summarize this tracking state:
Total procurement items: ${items.length}
Delayed/Overdue items: ${delayed.length}
Items detail: ${items.slice(0, 5).map((i) => `${i.material} (Status: ${i.status}, Vendor: ${i.vendor?.name || 'N/A'})`).join('\n')}

Provide a 2-sentence warning or update on the procurement delay risk.`;

    const summary = await askGemini(prompt);

    return {
      success: true,
      content: summary,
      confidence: 0.9,
      findings,
      metadata: {
        totalItems: items.length,
        delayedCount: delayed.length,
      },
    };
  }
}

// =============================================================================
// 6. Project Health Agent
// =============================================================================
export class ProjectHealthAgent extends BaseAgentImpl {
  readonly type: AgentType = 'PROJECT_HEALTH';
  readonly name = 'Project Health Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    // Query metrics
    const [docs, compliance, activities, procurement] = await Promise.all([
      prisma.document.findMany({ where: { projectId: input.projectId, deletedAt: null } }),
      prisma.complianceCheck.findFirst({ where: { projectId: input.projectId }, orderBy: { createdAt: 'desc' } }),
      prisma.scheduleActivity.findMany({ where: { projectId: input.projectId } }),
      prisma.procurementItem.findMany({ where: { projectId: input.projectId } }),
    ]);

    const docHealth = docs.length > 0 ? (docs.filter((d) => d.status === 'PROCESSED').length / docs.length) * 100 : 100;
    const complianceScore = compliance?.complianceScore ?? 100;
    
    let avgScheduleRisk = 0;
    if (activities.length > 0) {
      avgScheduleRisk = activities.reduce((acc, a) => acc + a.riskScore, 0) / activities.length;
    }

    // Health score formula: 0.4×docHealth + 0.3×complianceScore + 0.3×(100−avgScheduleRisk)
    const score = Math.round(0.4 * docHealth + 0.3 * complianceScore + 0.3 * (100 - avgScheduleRisk));

    const findings: AgentFinding[] = [];
    if (score < 70) {
      findings.push({
        type: 'WARNING',
        title: 'Deteriorated Project Health',
        message: `Project health score is ${score}/100, which is below the threshold of 75.`,
        severity: 'high',
        details: { score, docHealth, complianceScore, avgScheduleRisk },
      });
    } else {
      findings.push({
        type: 'SUCCESS',
        title: 'Project Health Satisfactory',
        message: `Project health score is stable at ${score}/100.`,
        severity: 'low',
      });
    }

    return {
      success: true,
      content: `Computed overall project health score: ${score}/100.\nBreakdown:\n- Document processing health: ${docHealth.toFixed(0)}%\n- Standards compliance score: ${complianceScore}%\n- Schedule delay risk: ${avgScheduleRisk.toFixed(0)}%`,
      confidence: 0.95,
      findings,
      metadata: {
        score,
        docHealth,
        complianceScore,
        avgScheduleRisk,
      },
    };
  }
}

// =============================================================================
// 7. Data Validation Agent
// =============================================================================
export class DataValidationAgent extends BaseAgentImpl {
  readonly type: AgentType = 'DATA_VALIDATION';
  readonly name = 'Data Validation Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const [orphanedRFIs, invalidActivities, unassignedItems] = await Promise.all([
      prisma.rfi.findMany({
        where: { projectId: input.projectId, documents: { none: {} } },
      }),
      prisma.scheduleActivity.findMany({
        where: { projectId: input.projectId, OR: [{ plannedStart: null }, { plannedFinish: null }] },
      }),
      prisma.procurementItem.findMany({
        where: { projectId: input.projectId, vendorId: null },
      }),
    ]);

    const findings: AgentFinding[] = [];
    if (orphanedRFIs.length > 0) {
      findings.push({
        type: 'WARNING',
        title: 'Orphaned RFIs Detected',
        message: `${orphanedRFIs.length} RFI(s) have no links to supporting project documents.`,
        severity: 'medium',
      });
    }
    if (invalidActivities.length > 0) {
      findings.push({
        type: 'ERROR',
        title: 'Invalid Schedule Activities',
        message: `${invalidActivities.length} activity line(s) lack planned start/finish dates.`,
        severity: 'high',
      });
    }

    const summary = `Data Validation Scan results:\n- Orphaned RFIs: ${orphanedRFIs.length}\n- Invalid Activities: ${invalidActivities.length}\n- Procurement items missing vendors: ${unassignedItems.length}`;

    return {
      success: true,
      content: summary,
      confidence: 0.98,
      findings,
    };
  }
}

// =============================================================================
// 8. Commissioning Agent
// =============================================================================
export class CommissioningAgent extends BaseAgentImpl {
  readonly type: AgentType = 'COMMISSIONING';
  readonly name = 'Commissioning Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const installedProcurementItems = await prisma.procurementItem.findMany({
      where: { projectId: input.projectId, status: 'INSTALLED' },
    });

    const summary = `Commissioning tracker: Checked installed equipment. Found ${installedProcurementItems.length} installed PO items ready for Level 1-5 commissioning tests.`;

    return {
      success: true,
      content: summary,
      confidence: 0.8,
      metadata: {
        readyCount: installedProcurementItems.length,
      },
    };
  }
}

// =============================================================================
// 9. Risk Analysis Agent
// =============================================================================
export class RiskAnalysisAgent extends BaseAgentImpl {
  readonly type: AgentType = 'RISK_ANALYSIS';
  readonly name = 'Risk Analysis Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    // Multi-modal risk aggregation
    const [compliance, activities, procurement] = await Promise.all([
      prisma.complianceCheck.findFirst({ where: { projectId: input.projectId }, orderBy: { createdAt: 'desc' } }),
      prisma.scheduleActivity.findMany({ where: { projectId: input.projectId, riskLevel: { in: ['HIGH', 'CRITICAL'] } } }),
      prisma.procurementItem.findMany({ where: { projectId: input.projectId, status: { notIn: ['RECEIVED', 'INSTALLED'] } } }),
    ]);

    const prompt = `You are the Risk Analysis Agent. Synthesize a composite project risk register narrative.
1. Compliance findings: ${compliance?.findings ? JSON.stringify(compliance.findings).slice(0, 1000) : 'None'}
2. Delayed activities: ${activities.slice(0, 5).map((a) => a.name).join(', ') || 'None'}
3. Open procurement lines: ${procurement.length}

Generate a formal risk executive summary.`;

    const summary = await askGemini(prompt);

    return {
      success: true,
      content: summary,
      confidence: 0.85,
    };
  }
}

// =============================================================================
// 10. Executive Copilot Agent
// =============================================================================
export class ExecutiveCopilotAgent extends BaseAgentImpl {
  readonly type: AgentType = 'EXECUTIVE_COPILOT';
  readonly name = 'Executive Copilot Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const prompt = `You are the Executive Copilot. Prepare a boardroom briefing outline for this project context.
Project ID: ${input.projectId}
Brief the board on potential issues, schedule drifts, and QA compliance checks. Keep it structured and bulleted.`;

    const summary = await askGemini(prompt);

    return {
      success: true,
      content: summary,
      confidence: 0.9,
    };
  }
}

// =============================================================================
// 11. Reporting Agent
// =============================================================================
export class ReportingAgent extends BaseAgentImpl {
  readonly type: AgentType = 'REPORTING';
  readonly name = 'Reporting Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const reportType = (input['reportType'] as string) || 'EXECUTIVE';
    const validTypes = ['DAILY', 'WEEKLY', 'EXECUTIVE', 'COMPLIANCE', 'RISK', 'PROCUREMENT'];
    const type = validTypes.includes(reportType) ? reportType : 'EXECUTIVE';

    try {
      const { generateReport } = await import('@/modules/reports/service');

      const result = await generateReport({
        projectId: input.projectId,
        type: type as any,
        userId: ctx.userId,
        runAsync: false,
      });

      const findings: AgentFinding[] = [{
        type: 'SUCCESS',
        title: 'Report Generated',
        message: `${type} report has been generated successfully. Report ID: ${result.reportId}`,
        severity: 'low',
        details: { reportId: result.reportId, type },
      }];

      return {
        success: true,
        content: `${type} report generated successfully. Report ID: ${result.reportId}. Access it from the Reports page or download via API.`,
        confidence: 0.95,
        findings,
        metadata: {
          reportId: result.reportId,
          reportType: type,
          status: result.status,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        content: `Failed to generate ${type} report: ${error.message}`,
        confidence: 0,
        findings: [{
          type: 'ERROR',
          title: 'Report Generation Failed',
          message: error.message,
          severity: 'high',
        }],
      };
    }
  }
}

// =============================================================================
// 12. Recommendation Agent
// =============================================================================
export class RecommendationAgent extends BaseAgentImpl {
  readonly type: AgentType = 'RECOMMENDATION';
  readonly name = 'Recommendation Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const prompt = `You are the Recommendation Agent. Generate three prescriptive optimization cards for Data Centre project delivery.
Each card must specify:
1. Title
2. Rationale
3. Action Plan (Mitigation step)
4. Confidence`;

    const summary = await askGemini(prompt);

    return {
      success: true,
      content: summary,
      confidence: 0.85,
    };
  }
}

// =============================================================================
// 13. Mitigation Planner Agent
// =============================================================================
export class MitigationPlannerAgent extends BaseAgentImpl {
  readonly type: AgentType = 'MITIGATION_PLANNER';
  readonly name = 'Mitigation Planner Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const simData = input['simulationData'] as any;
    
    let prompt = `You are the Mitigation Planner. Develop a schedule recovery logic.
If a project is critical path delayed on Generator Testing or Chiller delivery by 4 weeks, what sequencing modifications can minimize delay propagation?
Provide concrete EPC work-around solutions.`;

    if (simData) {
      prompt = `You are the Mitigation Planner Agent. A delay simulation has just been run.
Target Activity ID: ${simData.targetActivityId}
Delay: ${simData.delayDays} days
Estimated Cost Impact: $${simData.costImpact || 0}
Impacted Downstream Entities: ${simData.impacts ? simData.impacts.map((i: any) => i.entityName).join(', ') : 'None'}

Provide 3 concrete alternative mitigation strategies to recover the schedule and minimize cost impact. For each strategy, provide:
1. Title
2. Description of the sequencing change or resource acceleration
3. Estimated recovery in days
4. Trade-off (e.g., cost increase vs time saved)
`;
    }

    const summary = await askGemini(prompt);

    return {
      success: true,
      content: summary,
      confidence: 0.85,
    };
  }
}
