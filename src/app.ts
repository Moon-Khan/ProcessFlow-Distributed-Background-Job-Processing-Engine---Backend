import express from 'express';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { requestTiming } from './middlewares/request-timing.middleware.js';
import { router } from './routes/index.js';

export function createApp() {
  const app = express();
  app.use(requestTiming);
  app.use(express.json());

  app.use(router);

  app.use(errorHandler);

  return app;
}
