import { Role } from '@prisma/client';
import { runComplianceCheck, getComplianceSummary } from './service';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    complianceCheck: {
      create: jest.fn(async (input: any) => ({
        id: 'check-1',
        status: 'COMPLETED',
        complianceScore: 88,
        standards: input.data.standards,
        findings: input.data.findings,
        summary: input.data.summary,
        createdAt: new Date('2026-07-12T00:00:00.000Z'),
        updatedAt: new Date('2026-07-12T00:00:00.000Z'),
      })),
      findFirst: jest.fn(async () => ({
        id: 'check-1',
        complianceScore: 88,
        status: 'COMPLETED',
        createdAt: new Date('2026-07-12T00:00:00.000Z'),
        summary: {
          totalFindings: 2,
          compliantFindings: 1,
          warningFindings: 1,
          failedFindings: 0,
          complianceScore: 88,
        },
      })),
    },
  },
}));

jest.mock('@/modules/projects', () => ({
  assertProjectAccess: jest.fn(async () => undefined),
}));

describe('compliance service', () => {
  it('stores and returns a compliance check result', async () => {
    const result = await runComplianceCheck({
      projectId: 'project-1',
      actor: { id: 'user-1', role: Role.ENGINEER },
      documentIds: ['doc-1'],
      standards: ['ASHRAE 90.4'],
    });

    expect(result.id).toBe('check-1');
    expect(result.complianceScore).toBeGreaterThanOrEqual(0);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('returns a summary for the latest compliance check', async () => {
    const summary = await getComplianceSummary({
      projectId: 'project-1',
      actor: { id: 'user-1', role: Role.ENGINEER },
    });

    expect(summary.latestCheck?.id).toBe('check-1');
    expect(summary.summary.complianceScore).toBe(88);
  });
});
