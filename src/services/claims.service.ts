import { AppDataSource } from '../db/data-source.js';
import { Claim } from '../db/entities/Claim.js';
import type { Pagination } from '../types/index.js';

// OFFSET pagination: simple, but deep pages get slower (Postgres still walks the skipped rows).
export function listClaims({ page, pageSize }: Pagination): Promise<Claim[]> {
  return AppDataSource.getRepository(Claim).find({
    order: { id: 'ASC' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}
