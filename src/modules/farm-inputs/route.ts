import { Router } from 'express';
import { listInputs, getInput, createInput, updateInput, deleteInput, listInputSales, createInputSale } from './controller';
import { authMiddleware, requireManager } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/sales',    authMiddleware, requireManager, listInputSales);
router.post('/sales',   authMiddleware, requireManager, createInputSale);
router.get('/',         authMiddleware, requireManager, listInputs);
router.get('/:id',      authMiddleware, requireManager, getInput);
router.post('/',        authMiddleware, requireManager, createInput);
router.patch('/:id',    authMiddleware, requireManager, updateInput);
router.delete('/:id',   authMiddleware, requireManager, deleteInput);

export default router;
