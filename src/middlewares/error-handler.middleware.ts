import type { ErrorRequestHandler } from 'express';

// Logs the real error, but never leaks its details to the client.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};
