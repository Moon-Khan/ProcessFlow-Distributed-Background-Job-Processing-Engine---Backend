import type { CLAIM_STATUSES, DEPARTMENTS } from '../constants/claims.constants.js';

// ---- Claims ----
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];
export type Department = (typeof DEPARTMENTS)[number];

export interface Pagination {
  page: number;
  pageSize: number;
}

// ---- Totals ----
export interface Bucket {
  count: number;
  amount: number;
}

// ---- Reports ----
export interface ReportFilters {
  department: Department;
  status?: ClaimStatus;
}

export interface UserTotal extends Bucket {
  userId: number;
}

export interface ReportTotals {
  filters: ReportFilters;
  count: number;
  totalAmount: number;
  byStatus: Record<string, Bucket>;
  byMonth: Record<string, Bucket>; // key: "YYYY-MM"
  topUsers: UserTotal[];
}

export interface ReportRequest extends ReportFilters {
  userId: number; // who asked for the report; the PDF is emailed to them
}

export interface GeneratedReport {
  reportId: number;
  createdAt: Date;
  totals: ReportTotals;
  pdf: PdfResult;
  email: EmailResult;
  timingsMs: { query: number; totals: number; pdf: number; email: number; save: number };
}

// ---- Email (generic: knows nothing about reports) ----
export interface EmailAttachment {
  filename: string;
  path: string; // read from disk while sending, so large files aren't held in memory
  contentType?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  messageId: string;
  to: string;
}

// ---- PDF (generic: knows nothing about claims or reports) ----
export type PdfAlign = 'left' | 'center' | 'right';
export type PdfCell = string | number;

export interface PdfColumn {
  header: string;
  width: number; // fraction of the content width; a table's widths should add up to 1
  align?: PdfAlign;
}

export type PdfSection =
  | { type: 'keyValue'; title?: string; items: Array<{ label: string; value: PdfCell }> }
  | { type: 'table'; title?: string; columns: PdfColumn[]; rows: PdfCell[][] }
  | { type: 'pageBreak' };

export interface PdfDocumentDefinition {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
}

export interface PdfResult {
  filePath: string;
  pages: number;
  bytes: number;
}

// ---- Metrics ----
export interface RouteStats {
  count: number;
  totalMs: number;
  maxMs: number;
  statuses: Record<string, number>;
}

export interface PgPool {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}
