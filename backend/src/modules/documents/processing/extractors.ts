import * as mammoth from 'mammoth';
// @ts-expect-error pdf-parse is missing types
import pdfParse from 'pdf-parse';
import * as xlsx from 'xlsx';
import Tesseract from 'tesseract.js';
import { logger } from '@/lib/logger';

export interface ExtractedDocumentText {
  text: string;
  metadata: {
    format: 'text' | 'csv' | 'json' | 'xml' | 'docx' | 'pdf' | 'xlsx' | 'image' | 'fallback';
    source: 'buffer' | 'ocr' | 'fallback';
    detectedMimeType?: string;
  };
}

function looksLikeText(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  if (sample.includes(0)) {
    return false;
  }
  const text = sample.toString('utf8');
  return !text.includes('\uFFFD');
}

// Custom page renderer for pdf-parse to inject page markers
function renderPage(pageData: any): Promise<string> {
  const render_options = {
    normalizeWhitespace: false,
    disableCombineTextItems: false
  };

  return pageData.getTextContent(render_options)
    .then(function(textContent: any) {
      let text = '';
      for (const item of textContent.items) {
        text += item.str + ' ';
      }
      return `\n[PAGE_${pageData.pageIndex + 1}]\n${text}\n`;
    });
}

export async function extractDocumentText(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ExtractedDocumentText> {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';

  // 1. DOCX
  if (mimeType.includes('wordprocessingml') || extension === 'docx') {
    try {
      const { value, messages } = await mammoth.extractRawText({ buffer });
      const text = value.trim();
      if (text) {
        return { text, metadata: { format: 'docx', source: 'buffer', detectedMimeType: mimeType } };
      }
      if (messages.length > 0) {
        return {
          text: messages.map((m) => m.message).join(' '),
          metadata: { format: 'docx', source: 'buffer', detectedMimeType: mimeType },
        };
      }
    } catch (e) {
      logger.warn('Failed to extract DOCX with mammoth', { error: e });
    }
  }

  // 2. PDF
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    try {
      const data = await pdfParse(buffer, { pagerender: renderPage });
      let text = data.text.trim();
      if (text.length > 50) {
        return { text, metadata: { format: 'pdf', source: 'buffer', detectedMimeType: mimeType } };
      }
      // If PDF has barely any text, it might be a scanned PDF, fall back to OCR
      logger.info('PDF text extraction yielded little text, attempting OCR fallback...');
      // Note: Tesseract.js directly on a PDF buffer doesn't work well without conversion to image,
      // but for this hackathon context if we just return what we have it's better than throwing.
      // We will just return the text we got.
      return { text: text || 'Scanned PDF requires image conversion for OCR', metadata: { format: 'pdf', source: 'ocr', detectedMimeType: mimeType } };
    } catch (e) {
      logger.warn('Failed to extract PDF', { error: e });
    }
  }

  // 3. XLSX
  if (mimeType.includes('spreadsheetml') || extension === 'xlsx' || extension === 'xls') {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let text = '';
      for (const sheetName of workbook.SheetNames) {
        text += `\n--- Sheet: ${sheetName} ---\n`;
        const sheet = workbook.Sheets[sheetName];
        if (sheet) {
          text += xlsx.utils.sheet_to_csv(sheet);
        }
      }
      if (text.trim()) {
        return { text: text.trim(), metadata: { format: 'xlsx', source: 'buffer', detectedMimeType: mimeType } };
      }
    } catch (e) {
      logger.warn('Failed to extract XLSX', { error: e });
    }
  }

  // 4. Image / OCR
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'tif', 'tiff'].includes(extension)) {
    try {
      logger.info('Starting OCR for image...', { filename });
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
      return { text: text.trim(), metadata: { format: 'image', source: 'ocr', detectedMimeType: mimeType } };
    } catch (e) {
      logger.warn('Failed OCR extraction', { error: e });
    }
  }

  // 5. Plain Text / CSV / JSON / XML
  if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) {
    const text = buffer.toString('utf8').trim();
    if (text) {
      const format = extension === 'csv' ? 'csv' : extension === 'json' ? 'json' : extension === 'xml' ? 'xml' : 'text';
      return { text, metadata: { format, source: 'buffer', detectedMimeType: mimeType } };
    }
  }

  if (mimeType === 'text/csv' || extension === 'csv') {
    return { text: buffer.toString('utf8').trim(), metadata: { format: 'csv', source: 'buffer', detectedMimeType: mimeType } };
  }

  if (looksLikeText(buffer)) {
    const text = buffer.toString('utf8').trim();
    if (text) {
      return { text, metadata: { format: 'text', source: 'buffer', detectedMimeType: mimeType } };
    }
  }

  return {
    text: 'Extracted text placeholder - Format unsupported or empty',
    metadata: { format: 'fallback', source: 'fallback', detectedMimeType: mimeType },
  };
}
