import { Router } from 'express';
import shopsRouter from './route';

const router = Router();
router.use('/shops', shopsRouter);

export default router;
