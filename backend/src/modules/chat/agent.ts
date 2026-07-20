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
import { extractMessageContent } from '@/core/utils/contentExtractor';

// LangGraph state interface
type AgentState = {
  messages: BaseMessage[];
};

// StateGraph initialization
const graph = new StateGraph<any>({
  channels: {
    messages: {
      value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
  },
}) as any;

// Create tools from existing retrievers
const hybridSearchTool = new DynamicStructuredTool<any>({
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

const getProjectDocumentsTool = new DynamicStructuredTool<any>({
  name: 'get_project_documents_info',
  description: 'Get the total number of documents and their names for the given project.',
  schema: z.object({
    projectId: z.string().describe('The ID of the project to check'),
  }),
  func: async ({ projectId }) => {
    try {
      const docs = await prisma.document.findMany({
        where: { projectId, deletedAt: null },
        select: { originalName: true, status: true }
      });
      if (docs.length === 0) {
        return "There are no documents in this project.";
      }
      const names = docs.map(d => `- ${d.originalName} (Status: ${d.status})`).join('\n');
      return `Total documents: ${docs.length}\nDocuments:\n${names}`;
    } catch (error) {
      console.error('Tool error:', error);
      return "An error occurred while fetching project documents.";
    }
  }
});

const tools = [hybridSearchTool, getProjectDocumentsTool];

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
    // Check for duplicate tool calls in the same conversational turn (ignoring tool call IDs)
    let previousToolCallsStr = '';
    for (let i = messages.length - 2; i >= 0; i--) {
      const msg = messages[i];
      if (msg._getType() === 'human') break;
      if (msg._getType() === 'ai' && (msg as AIMessage).tool_calls && (msg as AIMessage).tool_calls!.length > 0) {
        previousToolCallsStr = JSON.stringify((msg as AIMessage).tool_calls?.map(tc => ({name: tc.name, args: tc.args})));
        break;
      }
    }
    
    const currentToolCallsStr = JSON.stringify(lastMessage.tool_calls.map(tc => ({name: tc.name, args: tc.args})));
    
    if (previousToolCallsStr && previousToolCallsStr === currentToolCallsStr) {
      console.warn('[Agent] Detected identical duplicate tool calls. Forcing END to prevent loop.');
      return END;
    }

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
- If the user asks a factual question about the project, compliance, or schedule, you MUST search the project documents.
- If the user asks about the number of documents or wants a list of documents, use the get_project_documents_info tool.
- If the search tool returns no relevant results (or if no documents have been uploaded to the project yet), explicitly inform the user that no project documents matched, but you MUST then provide a comprehensive, structured answer using your deep expert Data Centre EPC domain knowledge (ASHRAE, NFPA, TIA-942, Tier standards, mechanical/electrical systems).
- When answering based on documents, explicitly cite the sources provided by the tool (e.g. "According to [Document Name], Page [X]...").
- Keep answers professional, well-formatted (using markdown tables and bullet points where appropriate), and technically precise.`;

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

  let resultState;
  try {
    resultState = await app.invoke(
      { messages: lcMessages },
      { recursionLimit: 20 }
    );
  } catch (error: any) {
    console.error('LangGraph error:', error);
    if (error.name === 'GraphRecursionError' || error.message?.includes('Recursion limit')) {
      return {
        content: "I'm sorry, but I had trouble processing that and got stuck while searching the documents. Could you please rephrase or ask a more specific question?",
        sources: [],
        suggestedQuestions: []
      };
    }
    throw error;
  }
  
  const finalMessages = resultState.messages;
  const finalMessage = finalMessages[finalMessages.length - 1] as AIMessage;
  
  // Extract sources from ToolMessages if any were used
  const toolMessages = finalMessages.filter((m: BaseMessage) => m._getType() === 'tool') as ToolMessage[];
  const sources = toolMessages.map(tm => ({ content: tm.content }));

  let content = extractMessageContent(finalMessage.content);
  
  // If the agent was forcefully stopped on a duplicate tool call, its content will be empty
  if (!content && finalMessage.tool_calls && finalMessage.tool_calls.length > 0) {
    content = "I searched the documents but couldn't find a definitive answer to your question. Could you please provide more specifics?";
  }

  let suggestedQuestions: string[] = [];

  return {
    content,
    sources,
    suggestedQuestions,
  };
}
