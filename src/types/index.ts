import type { CLAIM_STATUSES, DEPARTMENTS } from '../constants/claims.constants.js';

// ---- Claims ----
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];
export type Department = (typeof DEPARTMENTS)[number];

export interface Pagination {
  page: number;
  pageSize: number;
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
