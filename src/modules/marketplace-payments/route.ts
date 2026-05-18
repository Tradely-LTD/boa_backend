import { Router } from 'express';
import { buyerAuthMiddleware } from '../../middlewares/buyerAuthMiddleware';
import { initiateOrderPayment, paystackWebhook, verifyPaymentByRef, getPaymentForOrder } from './controller';

export const marketplacePaymentsRouter = Router();

marketplacePaymentsRouter.post('/initiate',          buyerAuthMiddleware, initiateOrderPayment);
marketplacePaymentsRouter.post('/webhook/paystack',  paystackWebhook);           // public — Paystack calls this
marketplacePaymentsRouter.get('/verify/:ref',        verifyPaymentByRef);         // public — callback page polls this
marketplacePaymentsRouter.get('/:orderId',           buyerAuthMiddleware, getPaymentForOrder);
