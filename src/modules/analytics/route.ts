import { Router } from 'express';
import { getStats } from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();
router.get('/', authMiddleware, getStats);

export default router;
