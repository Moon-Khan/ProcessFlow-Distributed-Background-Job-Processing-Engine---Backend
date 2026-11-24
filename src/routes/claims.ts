import { Router } from 'express';
import { getClaims } from '../controllers/claims.controller.js';

export const claimsRouter = Router();

claimsRouter.get('/', getClaims);
