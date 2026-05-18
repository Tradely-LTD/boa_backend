import { Router } from 'express';
import { listReceipts, getReceipt, createReceipt, updateReceiptStatus, verifyReceipt } from './controller';
import { authMiddleware, requireManager } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/verify/:receiptNumber', verifyReceipt);
router.get('/',           authMiddleware, requireManager, listReceipts);
router.get('/:id',        authMiddleware, requireManager, getReceipt);
router.post('/',          authMiddleware, requireManager, createReceipt);
router.patch('/:id/status', authMiddleware, requireManager, updateReceiptStatus);

export default router;
