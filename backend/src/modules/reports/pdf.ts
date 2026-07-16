// @ts-nocheck
import PDFDocument from 'pdfkit';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Simple Markdown → PDFKit renderer
// ---------------------------------------------------------------------------

interface PdfOptions {
  title: string;
  projectName: string;
  generatedAt: string;
}

/**
 * Converts Markdown content to a PDF buffer using PDFKit.
 * Handles headers (h1–h3), bold, tables, blockquotes, and paragraphs.
 */
export async function markdownToPdf(markdown: string, options: PdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 50, right: 50 },
        info: {
          Title: options.title,
          Author: 'DCBrain AI Platform',
          Subject: `${options.projectName} — ${options.title}`,
          Creator: 'DCBrain Reporting Engine',
        },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Branding header
      doc
        .fontSize(10)
        .fillColor('#6B7280')
        .text('DCBrain AI Platform', 50, 20, { align: 'left' })
        .text(new Date(options.generatedAt).toLocaleString(), 50, 20, { align: 'right' })
        .moveDown(2);

      const lines = markdown.split('\n');
      let inTable = false;
      let tableHeaders: string[] = [];
      let tableRows: string[][] = [];

      const flushTable = () => {
        if (tableHeaders.length === 0 && tableRows.length === 0) return;

        const colCount = tableHeaders.length || (tableRows[0]?.length ?? 0);
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const colWidth = pageWidth / colCount;
        const startX = doc.page.margins.left;
        let y = doc.y;

        // Header row
        if (tableHeaders.length > 0) {
          doc.fontSize(9).fillColor('#1F2937').font('Helvetica-Bold');
          for (let i = 0; i < tableHeaders.length; i++) {
            doc.text((tableHeaders[i] ?? '').trim(), startX + i * colWidth, y, {
              width: colWidth - 8,
              continued: false,
            });
          }
          y = doc.y + 4;
          doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#D1D5DB').stroke();
          y += 6;
        }

        // Data rows
        doc.font('Helvetica').fontSize(9).fillColor('#374151');
        for (const row of tableRows) {
          const rowY = y;
          for (let i = 0; i < row.length; i++) {
            doc.text((row[i] ?? '').trim(), startX + i * colWidth, rowY, {
              width: colWidth - 8,
              continued: false,
            });
          }
          y = doc.y + 4;

          if (y > doc.page.height - doc.page.margins.bottom - 40) {
            doc.addPage();
            y = doc.page.margins.top;
          }
        }

        doc.y = y + 8;
        tableHeaders = [];
        tableRows = [];
        inTable = false;
      };

      for (const rawLine of lines) {
        const line = rawLine.trimEnd();

        // Table line detection
        if (line.startsWith('|') && line.endsWith('|')) {
          const cells = line.split('|').slice(1, -1);

          // Separator row (e.g., |---|---|)
          if (cells.every((c) => /^[\s-:]+$/.test(c))) {
            continue;
          }

          if (!inTable) {
            inTable = true;
            tableHeaders = cells;
          } else {
            tableRows.push(cells);
          }
          continue;
        }

        // Non-table line → flush any pending table
        if (inTable) {
          flushTable();
        }

        // Horizontal rule
        if (/^---+$/.test(line.trim())) {
          const ruleY = doc.y + 4;
          doc.moveTo(50, ruleY).lineTo(doc.page.width - 50, ruleY).strokeColor('#E5E7EB').stroke();
          doc.y = ruleY + 12;
          continue;
        }

        // Headings
        if (line.startsWith('# ')) {
          flushTable();
          doc.moveDown(0.5);
          doc.fontSize(22).fillColor('#111827').font('Helvetica-Bold');
          doc.text(line.replace(/^#\s+/, ''));
          doc.moveDown(0.5);
          continue;
        }
        if (line.startsWith('## ')) {
          flushTable();
          doc.moveDown(0.5);
          doc.fontSize(16).fillColor('#1F2937').font('Helvetica-Bold');
          doc.text(line.replace(/^##\s+/, ''));
          doc.moveDown(0.3);
          continue;
        }
        if (line.startsWith('### ')) {
          flushTable();
          doc.moveDown(0.3);
          doc.fontSize(13).fillColor('#374151').font('Helvetica-Bold');
          doc.text(line.replace(/^###\s+/, ''));
          doc.moveDown(0.2);
          continue;
        }

        // Blockquotes (callouts)
        if (line.startsWith('>')) {
          const content = line.replace(/^>\s*/, '').replace(/[⚠️✅]/g, '').trim();
          doc.fontSize(10).fillColor('#4B5563').font('Helvetica-Oblique');
          doc.text(`  ${content}`, { indent: 15 });
          doc.font('Helvetica');
          continue;
        }

        // Empty line
        if (line.trim() === '') {
          doc.moveDown(0.3);
          continue;
        }

        // Regular paragraph — strip bold markers for PDF
        const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1');
        doc.fontSize(10).fillColor('#374151').font('Helvetica');
        doc.text(cleanLine);

      }

      // Flush any trailing table
      if (inTable) {
        flushTable();
      }

      // Page numbers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .fillColor('#9CA3AF')
          .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 30, {
            align: 'center',
            width: doc.page.width - 100,
          });
      }

      doc.end();
    } catch (error) {
      logger.error('PDF generation failed', { error });
      reject(error);
    }
  });
}
