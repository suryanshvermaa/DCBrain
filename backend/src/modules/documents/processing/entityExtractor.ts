import { z } from 'zod';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import config from '@/core/config';
import { executeWrite } from '@/lib/neo4j';
import { logger } from '@/lib/logger';

const EntityExtractionSchema = z.object({
  equipment: z.array(z.string()).describe("List of equipment or machinery mentioned"),
  vendors: z.array(z.string()).describe("List of vendors, manufacturers, or contractors mentioned"),
  standards: z.array(z.string()).describe("List of compliance standards or codes (e.g., ASHRAE, NFPA) mentioned"),
  activities: z.array(z.string()).describe("List of project activities or tasks mentioned"),
  documents: z.array(z.string()).describe("List of other documents referenced"),
  relationships: z.array(z.object({
    source: z.string().describe("The name of the source entity"),
    sourceLabel: z.enum(['Equipment', 'Vendor', 'Standard', 'Activity', 'DocumentReference']).describe("The label of the source entity"),
    target: z.string().describe("The name of the target entity"),
    targetLabel: z.enum(['Equipment', 'Vendor', 'Standard', 'Activity', 'DocumentReference']).describe("The label of the target entity"),
    type: z.enum(['REFERENCES', 'SUPPLIES', 'DEPENDS_ON', 'GOVERNS', 'MENTIONS']).describe("The type of relationship"),
  })).describe("List of relationships between the extracted entities").optional(),
});

export async function extractAndStoreEntities(
  text: string, 
  documentId: string, 
  projectId: string, 
  chunkIndex: number
) {
  if (!config.GEMINI_API_KEY) {
    logger.warn('Skipping entity extraction: GEMINI_API_KEY is missing');
    return;
  }
  
  if (!text.trim()) return;
  
  let result: z.infer<typeof EntityExtractionSchema>;
  try {
    const model = new ChatGoogleGenerativeAI({
      modelName: config.GEMINI_MODEL || 'gemma-4-31b-it',
      apiKey: config.GEMINI_API_KEY,
      temperature: 0.1,
    });
    
    const structuredModel = model.withStructuredOutput(EntityExtractionSchema);
    result = await structuredModel.invoke([
      ["system", "You are an expert EPC engineering assistant. Extract the requested entities from the provided document chunk."],
      ["human", text]
    ]);
  } catch (llmErr: any) {
    if (llmErr?.status === 503 || llmErr?.status === 429 || llmErr?.code === 'ECONNRESET' || llmErr?.code === 'ENOTFOUND') {
      throw llmErr; // Transient LLM API/network failure -> rethrow for worker retry
    }
    logger.warn('LLM failed to extract entities from chunk (per-chunk LLM issue)', { error: llmErr?.message, documentId, chunkIndex });
    return;
  }
  
  // Store in Neo4j (distinguish infrastructure failure and rethrow so reconciliation/retries fire)
  try {
    await executeWrite(async (tx) => {
      // Ensure Document node exists
      await tx.run(
        `MERGE (d:Document {id: $documentId})
         ON CREATE SET d.projectId = $projectId`,
        { documentId, projectId }
      );
      
      const chunkId = `${documentId}-${chunkIndex}`;
      await tx.run(
        `MERGE (c:Chunk {id: $chunkId})
         ON CREATE SET c.documentId = $documentId, c.chunkIndex = $chunkIndex
         MERGE (d:Document {id: $documentId})
         MERGE (d)-[:CONTAINS]->(c)`,
        { chunkId, documentId, chunkIndex }
      );
      
      const linkEntities = async (label: string, entities: string[]) => {
        for (const entity of entities) {
          const entityName = entity.trim().toUpperCase();
          if (!entityName) continue;
          await tx.run(
            `MERGE (e:${label} {name: $entityName})
             MERGE (c:Chunk {id: $chunkId})
             MERGE (c)-[:MENTIONS]->(e)`,
            { entityName, chunkId }
          );
        }
      };
      
      await linkEntities('Equipment', result.equipment);
      await linkEntities('Vendor', result.vendors);
      await linkEntities('Standard', result.standards);
      await linkEntities('Activity', result.activities);
      await linkEntities('DocumentReference', result.documents);

      if (result.relationships) {
        for (const rel of result.relationships) {
          const sourceName = rel.source.trim().toUpperCase();
          const targetName = rel.target.trim().toUpperCase();
          if (!sourceName || !targetName) continue;
          
          await tx.run(
            `MATCH (a:${rel.sourceLabel} {name: $sourceName})
             MATCH (b:${rel.targetLabel} {name: $targetName})
             MERGE (a)-[:${rel.type}]->(b)`,
            { sourceName, targetName }
          );
        }
      }
    });
  } catch (neo4jErr) {
    logger.error('Neo4j infrastructure failure during entity storage', { error: neo4jErr, documentId, chunkIndex });
    throw neo4jErr;
  }
}
