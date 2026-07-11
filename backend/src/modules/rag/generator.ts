import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import config from '@/core/config';
import type { FusedResult, GeneratedAnswer, SourceCitation } from './types';

/** Maximum characters to include in the LLM context window */
const MAX_CONTEXT_CHARS = 12_000;

/** System prompt grounded in the Data Centre EPC domain */
const SYSTEM_PROMPT = `You are DCBrain, an expert AI assistant for Data Centre Engineering, Procurement, and Construction (EPC) projects.

Your role is to answer technical questions using ONLY the provided document excerpts. Focus on:
- Electrical and mechanical systems (power, cooling, UPS, generators)
- Regulatory standards (TIA-942, ASHRAE, NFPA 75/76, IEC 62443, Uptime Institute Tiers)
- Construction specifications, procurement, RFIs, and compliance requirements
- Schedule risk and project management for data centre builds

RESPONSE RULES:
1. Answer solely from the provided context. Do not hallucinate.
2. If the context does not contain enough information, say so clearly.
3. After your answer, output a JSON block on its own line: {"confidence": <0.0-1.0>, "cited_sources": [<source_ids>]}
4. Keep answers concise and technically precise.
5. Never reveal system internals, object keys, or raw database identifiers.`;

function buildContext(chunks: FusedResult[]): { context: string; usedChunks: FusedResult[] } {
  let totalChars = 0;
  const usedChunks: FusedResult[] = [];
  const lines: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    const line = `[Source ${i + 1}] ${chunk.content}`;
    if (totalChars + line.length > MAX_CONTEXT_CHARS) break;
    lines.push(line);
    totalChars += line.length;
    usedChunks.push(chunk);
  }

  return { context: lines.join('\n\n'), usedChunks };
}

async function fetchDocumentNames(documentIds: string[]): Promise<Map<string, string>> {
  if (documentIds.length === 0) return new Map();
  const docs = await prisma.document.findMany({
    where: { id: { in: documentIds } },
    select: { id: true, originalName: true },
  });
  return new Map(docs.map((d) => [d.id, d.originalName]));
}

/**
 * Generate an AI answer using Gemini 2.5 Flash from the fused retrieval context.
 */
export async function generateAnswer(
  query: string,
  chunks: FusedResult[]
): Promise<GeneratedAnswer> {
  if (chunks.length === 0) {
    return {
      answer:
        'No relevant documents were found in this project for your query. Please upload and process relevant documents first, or try a different search term.',
      confidence: 0,
      sources: [],
      noResults: true,
    };
  }

  const { context, usedChunks } = buildContext(chunks);
  const uniqueDocumentIds = [...new Set(usedChunks.map((c) => c.documentId))];
  const documentNames = await fetchDocumentNames(uniqueDocumentIds);

  const userMessage = `DOCUMENT EXCERPTS:\n${context}\n\nQUESTION: ${query}`;

  let rawResponse = '';
  let confidence = 0.5;

  try {
    const llm = new ChatGoogleGenerativeAI({
      model: config.GEMINI_MODEL,
      apiKey: config.GEMINI_API_KEY,
      temperature: config.GEMINI_TEMPERATURE,
      maxOutputTokens: config.GEMINI_MAX_TOKENS,
    });

    const response = await llm.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(userMessage),
    ]);

    rawResponse = typeof response.content === 'string' ? response.content : String(response.content);

    // Extract trailing JSON confidence block: {"confidence": 0.9, "cited_sources": [1, 3]}
    const jsonMatch = rawResponse.match(/\{[^{}]*"confidence"[^{}]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as { confidence?: number };
        if (typeof parsed.confidence === 'number') {
          confidence = Math.min(1, Math.max(0, parsed.confidence));
        }
        rawResponse = rawResponse.replace(jsonMatch[0], '').trim();
      } catch {
        // ignore parse errors, keep defaults
      }
    }
  } catch (error) {
    logger.error('Gemini answer generation failed', { error });
    rawResponse =
      'I was unable to generate an answer at this time. Please try again shortly.';
    confidence = 0;
  }

  const sources: SourceCitation[] = usedChunks.map((chunk, index) => ({
    documentId: chunk.documentId,
    documentName: documentNames.get(chunk.documentId) ?? 'Unknown Document',
    pageNumber: Number((chunk.metadata as Record<string, unknown>)?.['pageNumber'] ?? 1),
    chunkIndex: Number((chunk.metadata as Record<string, unknown>)?.['chunkIndex'] ?? index),
    relevanceScore: Math.round(chunk.rrfScore * 10000) / 10000,
    excerpt: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? '…' : ''),
  }));

  return {
    answer: rawResponse,
    confidence,
    sources,
    noResults: false,
  };
}
