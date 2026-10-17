import express, { type ErrorRequestHandler } from 'express';
import { metricsHandler, requestTiming } from './metrics.js';
import { claimsRouter } from './routes/claims.js';

export function createApp() {
  const app = express();
  app.use(requestTiming);
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/metrics', metricsHandler);
  app.use('/claims', claimsRouter);

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  };
  app.use(errorHandler);

  return app;
}
