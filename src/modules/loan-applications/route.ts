import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../../middlewares/authMiddleware';
import { listLoans, getLoan, createLoan, createLoanPublic, updateLoanStatus } from './controller';

const router = Router();

router.post('/public',        createLoanPublic);                              // public — farmer self-service
router.get('/',               authMiddleware, listLoans);
router.get('/:id',            authMiddleware, getLoan);
router.post('/',              authMiddleware, createLoan);
router.patch('/:id/status',   authMiddleware, requireSuperAdmin, updateLoanStatus);

export default router;
