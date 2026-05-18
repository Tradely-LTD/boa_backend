import { Router } from 'express';
import { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from './controller';
import { authMiddleware, requireManager } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/',     authMiddleware, requireManager, listSuppliers);
router.get('/:id',  authMiddleware, requireManager, getSupplier);
router.post('/',    authMiddleware, requireManager, createSupplier);
router.patch('/:id',  authMiddleware, requireManager, updateSupplier);
router.delete('/:id', authMiddleware, requireManager, deleteSupplier);

export default router;
