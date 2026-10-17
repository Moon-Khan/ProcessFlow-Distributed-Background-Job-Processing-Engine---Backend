import { Router } from 'express';
import { AppDataSource } from '../db/data-source.js';
import { Claim } from '../db/entities/Claim.js';

const MAX_PAGE_SIZE = 100;

export const claimsRouter = Router();

// GET /claims?page=1&pageSize=50
// OFFSET pagination: simple, but deep pages get slower (Postgres still walks the skipped rows).
claimsRouter.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.pageSize) || 50));

  const items = await AppDataSource.getRepository(Claim).find({
    order: { id: 'ASC' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  res.json({ page, pageSize, items });
});
