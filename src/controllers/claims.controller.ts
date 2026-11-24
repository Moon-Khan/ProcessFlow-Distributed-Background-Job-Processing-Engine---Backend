import type { Request, Response } from 'express';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants/claims.constants.js';
import { listClaims } from '../services/claims.service.js';

// GET /claims?page=1&pageSize=50
export async function getClaims(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.pageSize) || DEFAULT_PAGE_SIZE));

  const items = await listClaims({ page, pageSize });

  res.json({ page, pageSize, items });
}
