import { Router } from 'express';
import {
  createApplication,
  listApplications,
  getApplication,
  updateStatus,
  getByRefId,
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

// Public
router.post('/',                createApplication);
router.get('/ref/:refId',       getByRefId);

// Admin protected
router.get('/',                 authMiddleware, listApplications);
router.get('/:id',              authMiddleware, getApplication);
router.patch('/:id/status',     authMiddleware, updateStatus);

export default router;
