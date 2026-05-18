import { Router } from 'express';
import {
  createRequest, listRequests, getRequest,
  assignCollector, markInTransit, markCollected, cancelRequest,
  listCollectors,
} from './controller';
import { authMiddleware, requireManager, requireManagerOrCollector } from '../../middlewares/authMiddleware';

const router = Router();

router.post('/',                         createRequest);
router.get('/collectors',                authMiddleware, requireManager, listCollectors);
router.get('/',                          authMiddleware, requireManagerOrCollector, listRequests);
router.get('/:id',                       authMiddleware, requireManagerOrCollector, getRequest);
router.patch('/:id/assign',              authMiddleware, requireManager, assignCollector);
router.patch('/:id/in-transit',          authMiddleware, requireManagerOrCollector, markInTransit);
router.patch('/:id/collected',           authMiddleware, requireManagerOrCollector, markCollected);
router.patch('/:id/cancel',              authMiddleware, requireManager, cancelRequest);

export default router;
