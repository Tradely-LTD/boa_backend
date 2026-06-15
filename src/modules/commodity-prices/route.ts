import { Router } from 'express';
import { authMiddleware, requireManager, requireSuperAdmin } from '../../middlewares/authMiddleware';
import { listPrices, lookupPrice, upsertPrice, deletePrice } from './controller';

const router = Router();

// Any authenticated user can look up prices (needed for loan cap calculation)
router.get('/',        authMiddleware, listPrices);
router.get('/lookup',  authMiddleware, lookupPrice);

// Only managers and above can set/update prices
router.post('/',       authMiddleware, requireManager, upsertPrice);
router.delete('/:id',  authMiddleware, requireSuperAdmin, deletePrice);

export default router;
