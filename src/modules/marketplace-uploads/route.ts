import { Router } from 'express';
import { authMiddleware, requireManager } from '../../middlewares/authMiddleware';
import { getUploadUrl } from './controller';

export const marketplaceUploadsRouter = Router();

marketplaceUploadsRouter.post('/presigned-url', authMiddleware, requireManager, getUploadUrl);
