import type { Request, Response } from 'express';
import { getMetricsSnapshot, resetMetricsWindow } from '../services/metrics.service.js';

// GET /metrics: numbers since the last call. ?reset=false keeps the window open.
export function getMetrics(req: Request, res: Response) {
  res.json(getMetricsSnapshot());
  if (req.query.reset !== 'false') resetMetricsWindow();
}
