import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import { logger } from '@/lib/logger';
import config from '@/core/config';
import type { ScoredActivity } from './risk-engine';

export interface MitigationResult {
  activityId: string;
  actions: string[];
}

// --------------------------------------------------------------------------
// Deterministic fallback rules
// --------------------------------------------------------------------------

const DURATION_RULE =
  'Break the activity into smaller, independently trackable sub-tasks and assign dedicated resources.';
const CRITICAL_PATH_RULE =
  'Fast-track parallel sub-activities and add buffer in the master schedule for this critical path item.';
const FLOAT_RULE =
  'Escalate to project manager — zero float leaves no schedule tolerance. Consider crashing the activity with additional resources.';
const OVERDUE_RULE =
  'Immediately review root cause of delayed start; reassign or procure resources and issue a revised start commitment.';
const GENERIC_RULE =
  'Review resource availability and predecessor completion. Update the schedule baseline and communicate impact to stakeholders.';

function deterministicActions(activity: ScoredActivity): string[] {
  const actions: string[] = [];

  if (activity.isCritical) actions.push(CRITICAL_PATH_RULE);
  if (activity.totalFloat <= 0 && !activity.isCritical) actions.push(FLOAT_RULE);
  if (activity.durationDays > 20) actions.push(DURATION_RULE);

  const now = new Date();
  const isOverdue =
    (activity.plannedStart &&
      !activity.actualStart &&
      activity.plannedStart < now) ||
    (activity.actualStart &&
      activity.plannedStart &&
      activity.actualStart > activity.plannedStart);
  if (isOverdue) actions.push(OVERDUE_RULE);

  if (actions.length === 0) actions.push(GENERIC_RULE);

  return actions;
}

// --------------------------------------------------------------------------
// LLM-powered recommendations (best-effort, falls back to deterministic)
// --------------------------------------------------------------------------

/**
 * Generate mitigation actions for a list of high-risk activities.
 *
 * Attempts to call Gemini for richer, context-aware recommendations.
 * Silently falls back to deterministic rules if the LLM is unavailable.
 */
export async function generateMitigations(
  activities: ScoredActivity[]
): Promise<Map<string, string[]>> {
  const resultMap = new Map<string, string[]>();

  // Only request LLM mitigations for HIGH / CRITICAL activities (cost guard)
  const highRisk = activities.filter((a) => a.riskScore >= 50);

  if (highRisk.length > 0) {
    try {
      const llm = new ChatGoogleGenerativeAI({
        model: config.GEMINI_MODEL,
        apiKey: config.GEMINI_API_KEY,
        temperature: 0.1,
        maxOutputTokens: 1024,
      });

      const activitiesText = highRisk
        .map(
          (a) =>
            `• "${a.name}" (ID: ${a.activityId}) — risk score: ${a.riskScore}, critical path: ${a.isCritical}, float: ${a.totalFloat} days, duration: ${a.durationDays} days`
        )
        .join('\n');

      const prompt = `You are a Data Centre EPC project scheduler. The following schedule activities have been flagged as high risk. For each activity, provide 1–3 concise, actionable mitigation steps. Respond ONLY with a JSON array where each element is {"activityId": "...", "actions": ["...", "..."]}.

Activities:
${activitiesText}`;

      const response = await llm.invoke([new HumanMessage(prompt)]);
      const text =
        typeof response.content === 'string'
          ? response.content.trim()
          : JSON.stringify(response.content);

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonText: string = jsonMatch?.[1] ?? text;

      const parsed = JSON.parse(jsonText) as { activityId: string; actions: string[] }[];

      for (const item of parsed) {
        if (item.activityId && Array.isArray(item.actions)) {
          resultMap.set(item.activityId, item.actions);
        }
      }
    } catch (err) {
      logger.warn('LLM mitigation generation failed; using deterministic fallback', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Fill in any activities not covered by LLM (including LOW/MEDIUM)
  for (const activity of activities) {
    if (!resultMap.has(activity.activityId)) {
      resultMap.set(activity.activityId, deterministicActions(activity));
    }
  }

  return resultMap;
}
