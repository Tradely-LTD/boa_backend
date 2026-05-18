import { Router } from 'express';
import { login, register, me } from './controller';
import { authMiddleware, requireSuperAdmin } from '../../middlewares/authMiddleware';

const router = Router();

router.post('/login',    login);
router.post('/register', authMiddleware, requireSuperAdmin, register);
router.get('/me',        authMiddleware, me);

export default router;
