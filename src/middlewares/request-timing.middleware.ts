import type { RequestHandler } from 'express';
import { performance } from 'node:perf_hooks';
import { config } from '../config.js';
import { recordRequest } from '../services/metrics.service.js';

export const requestTiming: RequestHandler = (req, res, next) => {
  if (req.path === '/metrics') return next(); // don't measure the measuring
  const start = performance.now();
  res.on('finish', () => {
    const ms = performance.now() - start;
    // Route pattern (e.g. "/claims/") rather than the raw URL, so query strings don't explode the keys.
    const routeKey = `${req.method} ${req.baseUrl ?? ''}${req.route?.path ?? req.path}`;
    recordRequest(routeKey, ms, res.statusCode);
    if (config.logRequests) console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
};
