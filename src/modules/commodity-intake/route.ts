import { Router } from 'express';
import { listIntakes, getIntake, createIntake } from './controller';
import { authMiddleware, requireManager } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/',    authMiddleware, requireManager, listIntakes);
router.get('/:id', authMiddleware, requireManager, getIntake);
router.post('/',   authMiddleware, requireManager, createIntake);

export default router;
