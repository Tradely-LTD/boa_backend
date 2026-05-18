import { Router } from 'express';
import { listCentres, getCentre, updateCentre, getCentreByRef } from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/ref/:refId',  getCentreByRef);                         // public
router.get('/',            authMiddleware, listCentres);
router.get('/:id',         authMiddleware, getCentre);
router.patch('/:id',       authMiddleware, updateCentre);

export default router;
