import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import {
  PDF_CELL_PADDING,
  PDF_COLORS,
  PDF_FONT_SIZE,
  PDF_FONTS,
  PDF_MARGIN,
  PDF_PAGE_SIZE,
  PDF_ROW_HEIGHT,
  PDF_SECTION_GAP,
} from '../constants/pdf.constants.js';
import type { PdfCell, PdfColumn, PdfDocumentDefinition, PdfResult, PdfSection } from '../types/index.js';

type Doc = PDFKit.PDFDocument;

// Generic PDF builder: give it a definition (title + sections) and a path, it handles
// layout, page breaks, repeated table headers and page numbers.
// Everything here is synchronous CPU work on the main thread, which is what Phase 1 measures.
export async function generatePdf(definition: PdfDocumentDefinition, filePath: string): Promise<PdfResult> {
  await mkdir(path.dirname(filePath), { recursive: true });

  const doc = new PDFDocument({ size: PDF_PAGE_SIZE, margin: PDF_MARGIN });
  const stream = createWriteStream(filePath);
  doc.pipe(stream);

  let pages = 1;
  drawFooter(doc, definition.title, pages);
  doc.on('pageAdded', () => drawFooter(doc, definition.title, ++pages));

  drawTitle(doc, definition);
  for (const section of definition.sections) drawSection(doc, section);

  doc.end();
  await once(stream, 'finish');

  return { filePath, pages, bytes: stream.bytesWritten };
}

function drawSection(doc: Doc, section: PdfSection): void {
  switch (section.type) {
    case 'pageBreak':
      doc.addPage();
      return;
    case 'keyValue':
      drawTable(
        doc,
        section.title,
        [{ header: '', width: 0.35 }, { header: '', width: 0.65 }],
        section.items.map((item) => [item.label, item.value]),
        false,
      );
      return;
    case 'table':
      drawTable(doc, section.title, section.columns, section.rows, true);
      return;
  }
}

function drawTitle(doc: Doc, { title, subtitle }: PdfDocumentDefinition): void {
  doc.font(PDF_FONTS.bold).fontSize(PDF_FONT_SIZE.title).fillColor(PDF_COLORS.text).text(title);
  if (subtitle) {
    doc.font(PDF_FONTS.regular).fontSize(PDF_FONT_SIZE.subtitle).fillColor(PDF_COLORS.muted).text(subtitle);
  }
  doc.y += PDF_SECTION_GAP;
}

function drawTable(doc: Doc, title: string | undefined, columns: PdfColumn[], rows: PdfCell[][], withHeader: boolean): void {
  const left = doc.page.margins.left;
  const contentWidth = doc.page.width - left - doc.page.margins.right;
  const widths = columns.map((c) => c.width * contentWidth);

  // Keep the title and at least a few rows together.
  if (doc.y + PDF_ROW_HEIGHT * 4 > bottomLimit(doc)) doc.addPage();

  if (title) {
    doc.font(PDF_FONTS.bold).fontSize(PDF_FONT_SIZE.heading).fillColor(PDF_COLORS.text).text(title, left, doc.y);
    doc.y += 4;
  }
  if (withHeader) drawRow(doc, columns.map((c) => c.header), columns, widths, 'header');

  rows.forEach((row, i) => {
    if (doc.y + PDF_ROW_HEIGHT > bottomLimit(doc)) {
      doc.addPage();
      if (withHeader) drawRow(doc, columns.map((c) => c.header), columns, widths, 'header');
    }
    drawRow(doc, row, columns, widths, i % 2 === 1 ? 'stripe' : 'plain');
  });

  doc.x = left;
  doc.y += PDF_SECTION_GAP;
}

function drawRow(doc: Doc, cells: PdfCell[], columns: PdfColumn[], widths: number[], style: 'header' | 'stripe' | 'plain'): void {
  const y = doc.y;
  let x = doc.page.margins.left;
  const totalWidth = widths.reduce((a, b) => a + b, 0);

  if (style !== 'plain') {
    doc.rect(x, y, totalWidth, PDF_ROW_HEIGHT).fill(style === 'header' ? PDF_COLORS.headerBg : PDF_COLORS.stripeBg);
  }

  doc
    .font(style === 'header' ? PDF_FONTS.bold : PDF_FONTS.regular)
    .fontSize(PDF_FONT_SIZE.body)
    .fillColor(PDF_COLORS.text);

  cells.forEach((cell, i) => {
    doc.text(String(cell), x + PDF_CELL_PADDING, y + (PDF_ROW_HEIGHT - PDF_FONT_SIZE.body) / 2, {
      width: widths[i] - PDF_CELL_PADDING * 2,
      align: columns[i].align ?? 'left',
      lineBreak: false,
    });
    x += widths[i];
  });

  doc.y = y + PDF_ROW_HEIGHT;
}

function drawFooter(doc: Doc, title: string, pageNumber: number): void {
  const { left, right, bottom, top } = doc.page.margins;
  // Writing inside the bottom margin would make PDFKit add a new page, so lift the margin briefly.
  doc.page.margins.bottom = 0;
  doc
    .font(PDF_FONTS.regular)
    .fontSize(PDF_FONT_SIZE.footer)
    .fillColor(PDF_COLORS.muted)
    .text(`${title}  ·  Page ${pageNumber}`, left, doc.page.height - bottom / 2 - PDF_FONT_SIZE.footer / 2, {
      width: doc.page.width - left - right,
      align: 'center',
      lineBreak: false,
    });
  doc.page.margins.bottom = bottom;
  doc.x = left;
  doc.y = top;
}

function bottomLimit(doc: Doc): number {
  return doc.page.height - doc.page.margins.bottom;
}
