import { Router } from 'express';
import { exportApplications, exportCentres } from './controller';
import { authMiddleware, requireSuperAdmin } from '../../middlewares/authMiddleware';

const router = Router();
router.get('/applications', authMiddleware, requireSuperAdmin, exportApplications);
router.get('/centres',      authMiddleware, requireSuperAdmin, exportCentres);

export default router;
