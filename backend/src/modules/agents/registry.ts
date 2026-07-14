import type { AgentType, BaseAgent } from './agent.types';
import { BaseAgentImpl } from './base.agent';
import { SupervisorAgent } from './supervisor.agent';
import {
  DocumentAgent,
  KnowledgeAgent,
  ComplianceAgent,
  ScheduleRiskAgent,
  ProcurementAgent,
  ProjectHealthAgent,
  DataValidationAgent,
  CommissioningAgent,
  RiskAnalysisAgent,
  ExecutiveCopilotAgent,
  ReportingAgent,
  RecommendationAgent,
  MitigationPlannerAgent,
} from './subagents';

const agentRegistry = new Map<AgentType, BaseAgentImpl>();

// Instantiate and register all 14 agents
const supervisor = new SupervisorAgent();
const document = new DocumentAgent();
const knowledge = new KnowledgeAgent();
const compliance = new ComplianceAgent();
const scheduleRisk = new ScheduleRiskAgent();
const procurement = new ProcurementAgent();
const projectHealth = new ProjectHealthAgent();
const dataValidation = new DataValidationAgent();
const commissioning = new CommissioningAgent();
const riskAnalysis = new RiskAnalysisAgent();
const executiveCopilot = new ExecutiveCopilotAgent();
const reporting = new ReportingAgent();
const recommendation = new RecommendationAgent();
const mitigationPlanner = new MitigationPlannerAgent();

agentRegistry.set('SUPERVISOR', supervisor);
agentRegistry.set('DOCUMENT', document);
agentRegistry.set('KNOWLEDGE', knowledge);
agentRegistry.set('COMPLIANCE', compliance);
agentRegistry.set('SCHEDULE_RISK', scheduleRisk);
agentRegistry.set('PROCUREMENT', procurement);
agentRegistry.set('PROJECT_HEALTH', projectHealth);
agentRegistry.set('DATA_VALIDATION', dataValidation);
agentRegistry.set('COMMISSIONING', commissioning);
agentRegistry.set('RISK_ANALYSIS', riskAnalysis);
agentRegistry.set('EXECUTIVE_COPILOT', executiveCopilot);
agentRegistry.set('REPORTING', reporting);
agentRegistry.set('RECOMMENDATION', recommendation);
agentRegistry.set('MITIGATION_PLANNER', mitigationPlanner);

export function getAgentInstance(type: AgentType): BaseAgentImpl | undefined {
  return agentRegistry.get(type);
}

export function getAllAgents(): BaseAgentImpl[] {
  return Array.from(agentRegistry.values());
}
