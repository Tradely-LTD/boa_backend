import { Router } from 'express';
import { listUsers, getUser, updateUser, changePassword, getMe, updateMe } from './controller';
import { authMiddleware, requireSuperAdmin } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/me',                       authMiddleware, getMe);
router.patch('/me',                     authMiddleware, updateMe);
router.get('/',                         authMiddleware, requireSuperAdmin, listUsers);
router.get('/:id',                     authMiddleware, getUser);
router.patch('/:id',                   authMiddleware, requireSuperAdmin, updateUser);
router.post('/:id/change-password',    authMiddleware, changePassword);

export default router;
