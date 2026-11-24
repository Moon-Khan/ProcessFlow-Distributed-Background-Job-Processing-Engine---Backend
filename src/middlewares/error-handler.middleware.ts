import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../errors/http-error.js';

// Expected errors (HttpError) return their own status and message.
// Anything else is a bug or an outage: log it, but never leak details to the client.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};
