import { BaseAgentImpl } from './base.agent';
import type { AgentType, AgentInput, AgentContext, AgentOutput } from './agent.types';
import { askGemini } from './llm';
import { getAgentInstance } from './registry';
import { logger } from '@/lib/logger';

interface RoutingPlan {
  agent_to_invoke: AgentType | 'NONE';
  extracted_parameters: Record<string, any>;
  rationale: string;
}

export class SupervisorAgent extends BaseAgentImpl {
  readonly type: AgentType = 'SUPERVISOR';
  readonly name = 'Supervisor Agent';

  async run(input: AgentInput, ctx: AgentContext): Promise<AgentOutput> {
    const query = input.query || '';
    if (!query) {
      return {
        success: true,
        content: 'I am the Supervisor Agent. Please provide a query for me to route to my sub-agents.',
        confidence: 1.0,
      };
    }

    // Define the intent classifier prompt
    const prompt = `You are the Supervisor Agent in DCBrain (Data Centre EPC platform).
Analyze the user query and route it to the single best sub-agent from the allowed list:
- 'DOCUMENT': If query is about processing files, uploads, OCR queue, or duplicate documents.
- 'KNOWLEDGE': If query is general QA about technical specs, RAG lookup, or general project details.
- 'COMPLIANCE': If query is about testing specifications/submittals against standards (NFPA, ASHRAE, etc.).
- 'SCHEDULE_RISK': If query is about P6 schedule activities, delays, critical path, or floats.
- 'PROCUREMENT': If query is about PO items, vendors, shipping status, lead times, or item delivery.
- 'PROJECT_HEALTH': If query is about the composite health index, metrics breakdown, or overall score.
- 'DATA_VALIDATION': If query is about data duplicates, missing values, schema alignment, or orphaned records.
- 'COMMISSIONING': If query is about Cx scripts, L1-5 commissioning tests, or installed equipment.
- 'RISK_ANALYSIS': If query is about composite risk assessment, risk narratives, or risk register.
- 'EXECUTIVE_COPILOT': If query is from executives asking for outlines or boardroom strategic briefings.
- 'REPORTING': If query is about generating weekly/daily progress status report sheets.
- 'RECOMMENDATION': If query is looking for optimization action cards, vendor alternatives, or improvement proposals.
- 'MITIGATION_PLANNER': If query asks for sequencing modifications, workarounds, or recovery schedules for delays.

Query: "${query}"

Return a JSON object with the following fields:
{
  "agent_to_invoke": "COMPLIANCE" | "KNOWLEDGE" | "SCHEDULE_RISK" | "PROCUREMENT" | "PROJECT_HEALTH" | "DATA_VALIDATION" | "COMMISSIONING" | "RISK_ANALYSIS" | "EXECUTIVE_COPILOT" | "REPORTING" | "RECOMMENDATION" | "MITIGATION_PLANNER" | "DOCUMENT" | "NONE",
  "extracted_parameters": { ... any filters or document IDs extracted from the user query ... },
  "rationale": "reason for this routing decision"
}`;

    const routingResponse = await askGemini(prompt, true);
    
    // Parse routing response
    const plan = this.parseRoutingPlan(routingResponse);
    logger.info(`Supervisor classified query`, { query, agentToInvoke: plan.agent_to_invoke, rationale: plan.rationale });

    if (plan.agent_to_invoke === 'NONE' || plan.agent_to_invoke === 'SUPERVISOR') {
      return {
        success: true,
        content: `I analyzed your query but could not route it to any specific sub-agent. Rationale: ${plan.rationale}`,
        confidence: 0.5,
      };
    }

    // Try to lookup and run the selected sub-agent
    try {
      const subAgent = getAgentInstance(plan.agent_to_invoke);
      if (!subAgent) {
        throw new Error(`Sub-agent ${plan.agent_to_invoke} is not registered in the framework registry.`);
      }

      // Execute sub-agent with the combined input parameters
      const mergedInput: AgentInput = {
        ...input,
        ...plan.extracted_parameters,
      };

      // Run subagent execution block (which writes its own logs in agent_runs)
      const subOutput = await subAgent.execute(mergedInput, ctx.userId);

      const finalResponsePrompt = `You are the Supervisor Agent. You routed the user query to the "${subAgent.name}".
Original Query: "${query}"
Sub-agent Response: "${subOutput.content}"

Present a summary response back to the user, incorporating key findings from the sub-agent. If findings or recommendations were surfaced, mention them.`;

      const responseText = await askGemini(finalResponsePrompt);

      return {
        success: true,
        content: responseText,
        confidence: subOutput.confidence,
        findings: subOutput.findings,
        sources: subOutput.sources,
        metadata: {
          routedTo: plan.agent_to_invoke,
          rationale: plan.rationale,
          subAgentOutput: subOutput.metadata,
        },
      };
    } catch (err: any) {
      logger.error('Supervisor failed to run delegated sub-agent', { error: err.message });
      return {
        success: false,
        content: `I routed your query to ${plan.agent_to_invoke} but execution failed: ${err.message}`,
        confidence: 0.2,
      };
    }
  }

  private parseRoutingPlan(jsonStr: string): RoutingPlan {
    const fallback: RoutingPlan = {
      agent_to_invoke: 'KNOWLEDGE',
      extracted_parameters: {},
      rationale: 'Failed to parse JSON routing plan, defaulting to Knowledge Agent',
    };

    return safeParseJson<RoutingPlan>(jsonStr, fallback);
  }
}

function safeParseJson<T>(jsonStr: string, fallback: T): T {
  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    return fallback;
  }
}
