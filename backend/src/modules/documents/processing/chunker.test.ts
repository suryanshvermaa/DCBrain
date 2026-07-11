import { splitTextIntoChunks } from './chunker';

describe('splitTextIntoChunks', () => {
  it('creates overlapping chunks and preserves metadata', () => {
    const text = 'Section One\nThis is a long sample paragraph that should be split into multiple chunks for processing.';

    const chunks = splitTextIntoChunks(text, {
      chunkSize: 18,
      chunkOverlap: 4,
      sectionHeader: 'Section One',
      pageNumber: 1,
    });

    expect(chunks.length).toBeGreaterThan(1);

    const firstChunk = chunks[0];
    const secondChunk = chunks[1];

    expect(firstChunk).toBeDefined();
    expect(secondChunk).toBeDefined();
    expect(firstChunk?.metadata.sectionHeader).toBe('Section One');
    expect(firstChunk?.metadata.pageNumber).toBe(1);
    expect(firstChunk?.metadata.chunkIndex).toBe(0);
    expect(secondChunk?.metadata.chunkIndex).toBe(1);
    expect(firstChunk?.content.length).toBeGreaterThan(0);
  });
});
