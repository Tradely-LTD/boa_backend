import { Router } from 'express';
import { buyerAuthMiddleware } from '../../middlewares/buyerAuthMiddleware';
import { registerBuyer, loginBuyer, getBuyerMe } from './controller';

export const marketplaceBuyersRouter = Router();

marketplaceBuyersRouter.post('/register', registerBuyer);
marketplaceBuyersRouter.post('/login',    loginBuyer);
marketplaceBuyersRouter.get('/me',        buyerAuthMiddleware, getBuyerMe);
