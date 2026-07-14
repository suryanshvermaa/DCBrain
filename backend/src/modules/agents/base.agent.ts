import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { AgentType, AgentInput, AgentContext, AgentOutput, BaseAgent } from './agent.types';

export abstract class BaseAgentImpl implements BaseAgent {
  abstract readonly type: AgentType;
  abstract readonly name: string;

  abstract run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput>;

  async execute(input: AgentInput, userId?: string): Promise<AgentOutput> {
    const run = await prisma.agentRun.create({
      data: {
        agentType: this.type,
        status: 'RUNNING',
        input: input as any,
        projectId: input.projectId,
        triggeredById: userId || null,
      },
    });

    const startTime = Date.now();
    const ctx: AgentContext = {
      userId,
      runId: run.id,
    };

    logger.info(`Starting agent execution`, { agentType: this.type, runId: run.id, projectId: input.projectId });

    try {
      const output = await this.run(input, ctx);
      const durationMs = Date.now() - startTime;
      
      const costEstimate = this.estimateCost(output);

      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: 'COMPLETED',
          output: output as any,
          durationMs,
          costEstimate,
        },
      });

      if (output.findings && output.findings.length > 0) {
        await this.createNotifications(input.projectId, output.findings, userId);
      }

      logger.info(`Agent execution completed`, { agentType: this.type, runId: run.id, durationMs });
      return output;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      logger.error(`Agent execution failed`, { agentType: this.type, runId: run.id, error: error.message });

      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          error: error.message || 'Unknown error occurred',
          durationMs,
        },
      });

      return {
        success: false,
        content: `Error running agent: ${error.message}`,
        confidence: 0,
      };
    }
  }

  private estimateCost(output: AgentOutput): number {
    const text = output.content + JSON.stringify(output.findings || '') + JSON.stringify(output.sources || '');
    const estTokens = Math.ceil(text.length / 4);
    return (estTokens * 0.0003) / 1000;
  }

  private async createNotifications(projectId: string, findings: any[], userId?: string) {
    try {
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true },
      });

      const recipientIds = members.map((m) => m.userId);
      if (userId && !recipientIds.includes(userId)) {
        recipientIds.push(userId);
      }

      for (const recipientId of recipientIds) {
        for (const finding of findings) {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              type: finding.type === 'ERROR' ? 'COMPLIANCE_ISSUE' : 'INFO',
              title: `${this.name} Finding: ${finding.title}`,
              message: finding.message,
              data: {
                projectId,
                agentType: this.type,
                severity: finding.severity,
                details: finding.details,
              },
            },
          });
        }
      }
    } catch (err) {
      logger.error('Failed to create notifications for agent findings', { error: err });
    }
  }
}
