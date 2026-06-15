import { Router } from 'express';
import { authMiddleware, requireManager } from '../../middlewares/authMiddleware';
import {
  listShops, getShop, createShop, updateShopStatus, addStaff,
  getShopInventory, createShopIntake,
  listShopSales, createShopSale,
  listShopExpenses, createShopExpense,
} from './controller';

const router = Router();

// Shop CRUD — managers manage shops; shop_owner can read their own
router.get('/',           authMiddleware, listShops);
router.get('/:id',        authMiddleware, getShop);
router.post('/',          authMiddleware, requireManager, createShop);
router.patch('/:id/status', authMiddleware, requireManager, updateShopStatus);

// Staff management
router.post('/:id/staff', authMiddleware, addStaff);

// Shop inventory
router.get('/:id/inventory',  authMiddleware, getShopInventory);
router.post('/:id/inventory', authMiddleware, createShopIntake);

// Shop sales
router.get('/:id/sales',  authMiddleware, listShopSales);
router.post('/:id/sales', authMiddleware, createShopSale);

// Shop expenses
router.get('/:id/expenses',  authMiddleware, listShopExpenses);
router.post('/:id/expenses', authMiddleware, createShopExpense);

export default router;
