import { Router } from 'express';
import { listNotifications } from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, listNotifications);

export default router;
