import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { config } from '../config.js';
import { REPORT_TOP_USERS } from '../constants/reports.constants.js';
import { AppDataSource } from '../db/data-source.js';
import { Claim } from '../db/entities/Claim.js';
import { Report } from '../db/entities/Report.js';
import type {
  Bucket,
  Department,
  EmailMessage,
  GeneratedReport,
  PdfDocumentDefinition,
  PdfResult,
  ReportFilters,
  ReportRequest,
  ReportTotals,
  UserTotal,
} from '../types/index.js';
import { addToBucket, capitalize, elapsedMs, formatDate, formatMoney, roundBuckets, roundMoney } from '../utils/index.js';
import { sendEmail } from './email.service.js';
import { generatePdf } from './pdf.service.js';
import { getUserOrFail } from './users.service.js';

// Naive on purpose (Phase 1): everything runs inside the HTTP request, on the main thread.
// If the email step fails, the whole request fails and the PDF work is wasted.
export async function generateReport({ userId, ...filters }: ReportRequest): Promise<GeneratedReport> {
  const user = await getUserOrFail(userId);

  let started = performance.now();
  const claims = await findClaims(filters);
  const queryMs = elapsedMs(started);

  started = performance.now();
  const totals = calculateTotals(claims, filters);
  const totalsMs = elapsedMs(started);

  started = performance.now();
  // posix join: the path is stored in the DB, so keep "/" even on Windows.
  const filePath = path.posix.join(config.reportsDir, `${filters.department}-${randomUUID()}.pdf`);
  const pdf = await generatePdf(buildPdfDefinition(totals, claims), filePath);
  const pdfMs = elapsedMs(started);

  started = performance.now();
  const email = await sendEmail(buildReportEmail(user.email, totals, pdf));
  const emailMs = elapsedMs(started);

  started = performance.now();
  const report = await saveReport(user.id, filters.department, pdf.filePath);
  const saveMs = elapsedMs(started);

  return {
    reportId: report.id,
    createdAt: report.createdAt,
    totals,
    pdf,
    email,
    timingsMs: { query: queryMs, totals: totalsMs, pdf: pdfMs, email: emailMs, save: saveMs },
  };
}

function saveReport(userId: number, department: Department, filePath: string): Promise<Report> {
  return AppDataSource.getRepository(Report).save({ userId, department, filePath });
}

function findClaims(filters: ReportFilters): Promise<Claim[]> {
  return AppDataSource.getRepository(Claim).find({
    where: { department: filters.department, ...(filters.status && { status: filters.status }) },
    order: { createdAt: 'ASC' },
  });
}

// Totals in JS rather than SQL SUM/GROUP BY: this is CPU work we want to observe.
function calculateTotals(claims: Claim[], filters: ReportFilters): ReportTotals {
  const byStatus: Record<string, Bucket> = {};
  const byMonth: Record<string, Bucket> = {};
  const byUser: Record<string, Bucket> = {};
  let totalAmount = 0;

  for (const claim of claims) {
    totalAmount += claim.amount;
    addToBucket(byStatus, claim.status, claim.amount);
    addToBucket(byMonth, claim.createdAt.toISOString().slice(0, 7), claim.amount);
    addToBucket(byUser, String(claim.userId), claim.amount);
  }

  const topUsers: UserTotal[] = Object.entries(roundBuckets(byUser))
    .map(([userId, b]) => ({ userId: Number(userId), ...b }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, REPORT_TOP_USERS);

  return {
    filters,
    count: claims.length,
    totalAmount: roundMoney(totalAmount),
    byStatus: roundBuckets(byStatus),
    byMonth: roundBuckets(byMonth),
    topUsers,
  };
}

function buildReportEmail(to: string, totals: ReportTotals, pdf: PdfResult): EmailMessage {
  const { department, status } = totals.filters;
  const scope = `${capitalize(department)}${status ? ` (${status})` : ''}`;

  return {
    to,
    subject: `Your ${scope} claims report`,
    text: [
      'Hello,',
      '',
      `Your ${scope} claims report is attached.`,
      `Claims: ${totals.count.toLocaleString('en-US')}`,
      `Total amount: ${formatMoney(totals.totalAmount)}`,
      '',
      'ProcessFlow',
    ].join('\n'),
    attachments: [{ filename: path.basename(pdf.filePath), path: pdf.filePath, contentType: 'application/pdf' }],
  };
}

function buildPdfDefinition(totals: ReportTotals, claims: Claim[]): PdfDocumentDefinition {
  const { department, status } = totals.filters;
  const amountColumns = [
    { header: 'Claims', width: 0.25, align: 'right' as const },
    { header: 'Amount', width: 0.35, align: 'right' as const },
  ];
  const bucketRows = (buckets: Record<string, Bucket>) =>
    Object.entries(buckets).map(([key, b]) => [capitalize(key), b.count, formatMoney(b.amount)]);

  return {
    title: `${capitalize(department)} claims report`,
    subtitle: `Generated ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
    sections: [
      {
        type: 'keyValue',
        title: 'Summary',
        items: [
          { label: 'Department', value: capitalize(department) },
          { label: 'Status', value: status ? capitalize(status) : 'All' },
          { label: 'Claims', value: totals.count.toLocaleString('en-US') },
          { label: 'Total amount', value: formatMoney(totals.totalAmount) },
        ],
      },
      {
        type: 'table',
        title: 'By status',
        columns: [{ header: 'Status', width: 0.4 }, ...amountColumns],
        rows: bucketRows(totals.byStatus),
      },
      {
        type: 'table',
        title: 'By month',
        columns: [{ header: 'Month', width: 0.4 }, ...amountColumns],
        rows: bucketRows(totals.byMonth),
      },
      {
        type: 'table',
        title: `Top ${REPORT_TOP_USERS} users by amount`,
        columns: [{ header: 'User ID', width: 0.4 }, ...amountColumns],
        rows: totals.topUsers.map((u) => [u.userId, u.count, formatMoney(u.amount)]),
      },
      { type: 'pageBreak' },
      {
        type: 'table',
        title: `Claim details (${totals.count.toLocaleString('en-US')})`,
        columns: [
          { header: 'Claim ID', width: 0.15, align: 'right' },
          { header: 'User ID', width: 0.15, align: 'right' },
          { header: 'Status', width: 0.2 },
          { header: 'Amount', width: 0.25, align: 'right' },
          { header: 'Created', width: 0.25, align: 'right' },
        ],
        rows: claims.map((c) => [c.id, c.userId, capitalize(c.status), formatMoney(c.amount), formatDate(c.createdAt)]),
      },
    ],
  };
}
