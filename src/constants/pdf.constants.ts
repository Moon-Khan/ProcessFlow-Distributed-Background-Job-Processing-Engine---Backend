export const PDF_PAGE_SIZE = 'A4';
export const PDF_MARGIN = 40;

export const PDF_FONTS = { regular: 'Helvetica', bold: 'Helvetica-Bold' } as const;

export const PDF_FONT_SIZE = { title: 18, subtitle: 10, heading: 12, body: 9, footer: 8 } as const;

export const PDF_COLORS = {
  text: '#111827',
  muted: '#6b7280',
  headerBg: '#e5e7eb',
  stripeBg: '#f3f4f6',
} as const;

// ~45 rows fit on an A4 page at this height.
export const PDF_ROW_HEIGHT = 16;
export const PDF_CELL_PADDING = 4;
export const PDF_SECTION_GAP = 18;
