import { Router } from 'express';
import { getInventoryOverview, getIntakesWithStock, listPosSales, getPosSale, createPosSale } from './controller';
import { authMiddleware, requireManager } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/',                   authMiddleware, requireManager, getInventoryOverview);
router.get('/intakes-for-centre', authMiddleware, requireManager, getIntakesWithStock);
router.get('/pos-sales',          authMiddleware, requireManager, listPosSales);
router.get('/pos-sales/:id',      authMiddleware, requireManager, getPosSale);
router.post('/pos-sales',         authMiddleware, requireManager, createPosSale);

export default router;
