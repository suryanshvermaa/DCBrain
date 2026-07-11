export interface ChunkMetadata {
  sectionHeader?: string;
  pageNumber?: number;
  chunkIndex: number;
  documentId: string;
}

export interface TextChunk {
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  sectionHeader?: string;
  pageNumber?: number;
  documentId: string;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function extractLatestPageNumber(textUpToChunk: string, defaultPage: number): number {
  const matches = [...textUpToChunk.matchAll(/\[PAGE_(\d+)\]/g)];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    if (lastMatch && lastMatch[1]) {
      return parseInt(lastMatch[1], 10);
    }
  }
  return defaultPage;
}

function stripPageMarkers(text: string): string {
  return text.replace(/\[PAGE_\d+\]/g, '').replace(/\s+/g, ' ').trim();
}

export function splitTextIntoChunks(
  text: string,
  options: Omit<ChunkOptions, 'documentId'> & { documentId?: string }
): TextChunk[] {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return [];
  }

  const chunkSize = Math.max(1, options.chunkSize);
  const chunkOverlap = Math.max(0, Math.min(options.chunkOverlap, chunkSize - 1));
  const chunkCount = Math.ceil(normalized.length / Math.max(1, chunkSize - chunkOverlap));
  const chunks: TextChunk[] = [];
  
  let currentPage = options.pageNumber ?? 1;

  for (let index = 0; index < chunkCount; index += 1) {
    const start = index * (chunkSize - chunkOverlap);
    const end = start + chunkSize;
    const rawContent = normalized.slice(start, end).trim();

    if (!rawContent) {
      continue;
    }
    
    // Find the latest page number up to the end of this chunk
    currentPage = extractLatestPageNumber(normalized.slice(0, end), currentPage);
    const cleanContent = stripPageMarkers(rawContent);
    
    if (!cleanContent) {
      continue;
    }

    chunks.push({
      content: cleanContent,
      metadata: {
        sectionHeader: options.sectionHeader,
        pageNumber: currentPage,
        chunkIndex: index,
        documentId: options.documentId ?? '',
      },
    });
  }

  return chunks;
}
