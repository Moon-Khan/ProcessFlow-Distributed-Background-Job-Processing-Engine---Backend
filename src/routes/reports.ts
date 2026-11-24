import { Router } from 'express';
import { createReport } from '../controllers/reports.controller.js';

export const reportsRouter = Router();

reportsRouter.post('/', createReport);
