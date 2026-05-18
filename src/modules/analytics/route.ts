import { Router } from 'express';
import { getStats, getCentreStats } from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();
router.get('/',                 authMiddleware, getStats);
router.get('/centre/:centreId', authMiddleware, getCentreStats);

export default router;
