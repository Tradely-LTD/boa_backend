import { Router } from 'express';
import pricesRouter from './route';

const router = Router();
router.use('/commodity-prices', pricesRouter);

export default router;
