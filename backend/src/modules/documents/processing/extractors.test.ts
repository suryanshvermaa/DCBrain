import { Document, Packer, Paragraph } from 'docx';
import { extractDocumentText } from './extractors';

describe('extractDocumentText', () => {
  it('extracts plain text from text buffers', async () => {
    const result = await extractDocumentText(
      Buffer.from('Hello world\nThis is a sample.'),
      'notes.txt',
      'text/plain'
    );

    expect(result.text).toContain('Hello world');
    expect(result.metadata.format).toBe('text');
  });

  it('extracts csv content into readable text', async () => {
    const result = await extractDocumentText(Buffer.from('name,role\nAda,Lovelace'), 'data.csv', 'text/csv');

    expect(result.text).toContain('Ada');
    expect(result.text).toContain('Lovelace');
    expect(result.metadata.format).toBe('csv');
  });

  it('extracts text from DOCX buffers', async () => {
    const doc = new Document({
      sections: [{ properties: {}, children: [new Paragraph('Hello from DOCX')] }],
    });
    const docxBuffer = await Packer.toBuffer(doc);

    const result = await extractDocumentText(docxBuffer, 'sample.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    expect(result.text).toContain('Hello from DOCX');
    expect(result.metadata.format).toBe('docx');
  });

  it('falls back to a placeholder for unsupported files', async () => {
    const result = await extractDocumentText(Buffer.from([0x00, 0x01, 0x02, 0x03]), 'archive.bin', 'application/octet-stream');

    expect(result.text).toContain('Extracted text placeholder');
    expect(result.metadata.format).toBe('fallback');
  });
});
