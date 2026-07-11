// @ts-nocheck
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { StateGraph, START, END, MemorySaver, messagesStateReducer } from '@langchain/langgraph';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage, BaseMessage } from '@langchain/core/messages';
import { z } from 'zod';
import config from '@/core/config';
import { semanticSearch, keywordSearch, embedQuery } from '@/modules/rag/retriever';
import { reciprocalRankFusion } from '@/modules/rag/fusion';
import type { ChatMessage as PrismaChatMessage } from '@prisma/client';
import prisma from '@/lib/prisma';

// LangGraph state interface
type AgentState = {
  messages: BaseMessage[];
};

// StateGraph initialization
const graph = new StateGraph<AgentState>({
  channels: {
    messages: {
      value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
  },
});

// Create tools from existing retrievers
const hybridSearchTool = new DynamicStructuredTool({
  name: 'project_document_search',
  description: 'Search project documents to find technical information, compliance standards, and schedule data.',
  schema: z.object({
    query: z.string().describe('The search query to look for in the documents'),
    projectId: z.string().describe('The ID of the project to search within'),
  }),
  func: async ({ query, projectId }) => {
    try {
      const queryEmbedding = await embedQuery(query);
      const [semanticResults, keywordResults] = await Promise.all([
        semanticSearch(projectId, queryEmbedding, 5),
        keywordSearch(projectId, query, 5),
      ]);
      const fusedResults = reciprocalRankFusion(semanticResults, keywordResults).slice(0, 5);
      
      if (fusedResults.length === 0) {
        return "No relevant documents found.";
      }

      // Fetch document names
      const docIds = [...new Set(fusedResults.map((r) => r.documentId))];
      const docs = await prisma.document.findMany({
        where: { id: { in: docIds } },
        select: { id: true, originalName: true },
      });
      const nameMap = new Map(docs.map((d) => [d.id, d.originalName]));

      // Format results for the LLM
      const formatted = fusedResults.map((chunk, i) => {
        const docName = nameMap.get(chunk.documentId) || 'Unknown Document';
        const page = (chunk.metadata as any)?.pageNumber || '?';
        return `[Source ${i + 1}] Document: ${docName}, Page: ${page}\nContent: ${chunk.content}`;
      });

      return formatted.join('\n\n');
    } catch (error) {
      console.error('Tool error:', error);
      return "An error occurred while searching documents.";
    }
  },
});

const tools = [hybridSearchTool];

const llm = new ChatGoogleGenerativeAI({
  model: config.GEMINI_MODEL,
  apiKey: config.GEMINI_API_KEY,
  temperature: 0.1,
  maxOutputTokens: config.GEMINI_MAX_TOKENS,
});

const llmWithTools = llm.bindTools(tools);

// Define graph nodes
async function agentNode(state: AgentState) {
  const { messages } = state;
  const response = await llmWithTools.invoke(messages);
  return { messages: [response] };
}

async function toolNode(state: AgentState) {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  
  if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    return { messages: [] };
  }

  const toolOutputs = await Promise.all(
    lastMessage.tool_calls.map(async (toolCall) => {
      const tool = tools.find((t) => t.name === toolCall.name);
      if (!tool) {
        return new ToolMessage({
          content: `Tool ${toolCall.name} not found.`,
          tool_call_id: toolCall.id!,
        });
      }
      const output = await tool.invoke(toolCall.args);
      console.log(`[Agent Tool] Executed ${toolCall.name} with args:`, toolCall.args, `| Output length: ${String(output).length}`);
      return new ToolMessage({
        content: String(output),
        tool_call_id: toolCall.id!,
      });
    })
  );

  return { messages: toolOutputs };
}

// Define edges
function shouldContinue(state: AgentState) {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'tools';
  }
  return END;
}

graph.addNode('agent', agentNode);
graph.addNode('tools', toolNode);

graph.addEdge(START, 'agent');
graph.addConditionalEdges('agent', shouldContinue);
graph.addEdge('tools', 'agent');

const app = graph.compile();

const SYSTEM_PROMPT = `You are DCBrain, an expert AI assistant for Data Centre Engineering, Procurement, and Construction (EPC) projects.
Your role is to answer questions using the provided tools to search project documents.
Always search the project documents when asked factual questions about the project, compliance, or schedule.
When answering, explicitly cite the sources provided by the tool (e.g. "According to [Document Name], Page [X]...").
Keep answers concise and technically precise.
Your current Project ID is injected via the tool schema.

At the end of your response, ALWAYS provide 2-3 suggested follow-up questions that the user might want to ask next. Format them as a JSON array inside a <suggested_questions> tag. For example:
<suggested_questions>
["What is the compliance standard for X?", "How does this affect the schedule?"]
</suggested_questions>`;

export async function runChatAgent(
  projectId: string,
  userId: string,
  history: PrismaChatMessage[]
) {
  const dynamicSystemPrompt = `${SYSTEM_PROMPT}\n\nCRITICAL: Your current Project ID is "${projectId}". You MUST use this exact Project ID when calling the project_document_search tool.`;
  // Convert Prisma history to LangChain messages
  const lcMessages: BaseMessage[] = [new SystemMessage(dynamicSystemPrompt)];
  
  for (const msg of history) {
    if (msg.role === 'USER') {
      lcMessages.push(new HumanMessage(msg.content));
    } else if (msg.role === 'ASSISTANT') {
      lcMessages.push(new AIMessage(msg.content));
    }
  }

  // If there's no history (i.e. just the system message), we shouldn't be calling this function without a user prompt.
  // Actually, the last message in history is the current user message, so we are good.

  const resultState = await app.invoke(
    { messages: lcMessages },
    { recursionLimit: 5 }
  );
  
  const finalMessages = resultState.messages;
  const finalMessage = finalMessages[finalMessages.length - 1] as AIMessage;
  
  // Extract sources from ToolMessages if any were used
  const toolMessages = finalMessages.filter((m: BaseMessage) => m._getType() === 'tool') as ToolMessage[];
  const sources = toolMessages.map(tm => ({ content: tm.content }));

  let content = typeof finalMessage.content === 'string' ? finalMessage.content : String(finalMessage.content);
  let suggestedQuestions: string[] = [];

  const sqMatch = content.match(/<suggested_questions>\s*(\[[^\]]+\])\s*<\/suggested_questions>/);
  if (sqMatch) {
    try {
      suggestedQuestions = JSON.parse(sqMatch[1]);
      content = content.replace(sqMatch[0], '').trim();
    } catch (e) {
      console.error('Failed to parse suggested questions', e);
    }
  }

  return {
    content,
    sources,
    suggestedQuestions,
  };
}
