import express, { type ErrorRequestHandler } from 'express';
import { claimsRouter } from './routes/claims.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/claims', claimsRouter);

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  };
  app.use(errorHandler);

  return app;
}
