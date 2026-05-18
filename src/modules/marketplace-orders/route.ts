import { Router } from 'express';
import { buyerAuthMiddleware }               from '../../middlewares/buyerAuthMiddleware';
import { authMiddleware, requireManager }    from '../../middlewares/authMiddleware';
import { createOrder, getBuyerOrders, getCentreOrders, updateOrderStatus, confirmPosPayment, confirmBankTransfer } from './controller';

export const marketplaceOrdersRouter = Router();

// Buyer routes
marketplaceOrdersRouter.post('/',            buyerAuthMiddleware, createOrder);
marketplaceOrdersRouter.get('/mine',         buyerAuthMiddleware, getBuyerOrders);

// Manager routes
marketplaceOrdersRouter.get('/centre',       authMiddleware, requireManager, getCentreOrders);
marketplaceOrdersRouter.patch('/:id/status',      authMiddleware, requireManager, updateOrderStatus);
marketplaceOrdersRouter.patch('/:id/confirm-pos',  authMiddleware, requireManager, confirmPosPayment);
marketplaceOrdersRouter.patch('/:id/confirm-bank', authMiddleware, requireManager, confirmBankTransfer);
