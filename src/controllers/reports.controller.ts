import type { Request, Response } from 'express';
import { CLAIM_STATUSES, DEPARTMENTS } from '../constants/claims.constants.js';
import { generateReport } from '../services/reports.service.js';
import type { ClaimStatus, Department } from '../types/index.js';
import { elapsedMs } from '../utils/index.js';

// POST /reports  body: { "userId": 1, "department": "health", "status"?: "approved" }
export async function createReport(req: Request, res: Response) {
  const { userId, department, status } = req.body ?? {};

  if (!Number.isInteger(userId) || userId < 1) {
    res.status(400).json({ error: 'userId is required and must be a positive integer' });
    return;
  }
  if (!DEPARTMENTS.includes(department)) {
    res.status(400).json({ error: `department is required, one of: ${DEPARTMENTS.join(', ')}` });
    return;
  }
  if (status !== undefined && !CLAIM_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${CLAIM_STATUSES.join(', ')}` });
    return;
  }

  const started = performance.now();
  const report = await generateReport({
    userId,
    department: department as Department,
    ...(status && { status: status as ClaimStatus }),
  });

  res.status(201).json({ ...report, durationMs: elapsedMs(started) });
}
