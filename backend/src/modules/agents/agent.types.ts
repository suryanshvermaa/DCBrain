export type AgentType =
  | 'SUPERVISOR'
  | 'DOCUMENT'
  | 'KNOWLEDGE'
  | 'COMPLIANCE'
  | 'SCHEDULE_RISK'
  | 'PROCUREMENT'
  | 'PROJECT_HEALTH'
  | 'DATA_VALIDATION'
  | 'COMMISSIONING'
  | 'RISK_ANALYSIS'
  | 'EXECUTIVE_COPILOT'
  | 'REPORTING'
  | 'RECOMMENDATION'
  | 'MITIGATION_PLANNER';

export interface AgentInput {
  projectId: string;
  query?: string;
  documentIds?: string[];
  standards?: string[];
  notes?: string;
  [key: string]: any;
}

export interface AgentContext {
  userId?: string;
  runId: string;
  [key: string]: any;
}

export interface AgentFinding {
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: any;
}

export interface AgentOutput {
  success: boolean;
  content: string;
  confidence: number; // 0 to 1
  sources?: Array<{ docId?: string; docName?: string; page?: number | string; content: string }>;
  findings?: AgentFinding[];
  metadata?: any;
}

export interface BaseAgent {
  type: AgentType;
  name: string;
  run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput>;
}
