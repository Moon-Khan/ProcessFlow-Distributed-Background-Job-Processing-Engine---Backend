import { Router } from 'express';
import { claimsRouter } from './claims.js';
import { healthRouter } from './health.js';
import { metricsRouter } from './metrics.js';

// Add new resources here.
export const router = Router();

router.use('/health', healthRouter);
router.use('/metrics', metricsRouter);
router.use('/claims', claimsRouter);
