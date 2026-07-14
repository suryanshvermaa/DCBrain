import { triggerAgentsOnEvent } from './triggers';
import { enqueueAgentExecution } from './queue';

jest.mock('./queue', () => ({
  enqueueAgentExecution: jest.fn(),
}));

const mockEnqueue = enqueueAgentExecution as jest.MockedFunction<typeof enqueueAgentExecution>;

describe('Agent Triggers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueue.mockResolvedValue('job-1');
  });

  it('queues document agents after document processing', async () => {
    await triggerAgentsOnEvent('document_processed', 'proj-1', 'user-1', { documentId: 'doc-1' });

    expect(mockEnqueue).toHaveBeenCalledTimes(2);
    expect(mockEnqueue).toHaveBeenCalledWith({
      projectId: 'proj-1',
      agentType: 'DOCUMENT',
      input: { projectId: 'proj-1', documentId: 'doc-1' },
      userId: 'user-1',
    });
    expect(mockEnqueue).toHaveBeenCalledWith({
      projectId: 'proj-1',
      agentType: 'DATA_VALIDATION',
      input: { projectId: 'proj-1', documentId: 'doc-1' },
      userId: 'user-1',
    });
  });

  it('queues schedule agents after schedule import', async () => {
    await triggerAgentsOnEvent('schedule_imported', 'proj-1');

    expect(mockEnqueue).toHaveBeenCalledTimes(2);
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ agentType: 'SCHEDULE_RISK' })
    );
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ agentType: 'PROJECT_HEALTH' })
    );
  });

  it('queues procurement agents after procurement import', async () => {
    await triggerAgentsOnEvent('procurement_imported', 'proj-1', undefined, { importedCount: 12 });

    expect(mockEnqueue).toHaveBeenCalledTimes(2);
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        agentType: 'PROCUREMENT',
        input: { projectId: 'proj-1', importedCount: 12 },
      })
    );
  });
});
