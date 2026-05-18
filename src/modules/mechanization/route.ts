import { Router } from 'express';
import {
  listAllTractors, addTractor, updateTractor, assignTractorToFac,
  attachImplements,
  getMyTractors, updateTractorStatus,
  getHireRequests, sendQuote, confirmPaymentAndAssign,
  listAllDeployments, getMyDeployments, markTractorReturned, updateDeploymentLocation,
  getAdminStats, getManagerStats,
} from './controller';
import { authMiddleware, requireSuperAdmin, requireManager } from '../../middlewares/authMiddleware';

const router = Router();

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats/admin',   authMiddleware, requireSuperAdmin, getAdminStats);
router.get('/stats/manager', authMiddleware, requireManager,    getManagerStats);

// ── Tractors (admin) ──────────────────────────────────────────────────────────
router.get('/tractors',                  authMiddleware, requireSuperAdmin, listAllTractors);
router.post('/tractors',                 authMiddleware, requireSuperAdmin, addTractor);
router.patch('/tractors/:id',            authMiddleware, requireSuperAdmin, updateTractor);
router.patch('/tractors/:id/assign-fac', authMiddleware, requireSuperAdmin, assignTractorToFac);

// ── Tractors (FAC manager) ────────────────────────────────────────────────────
router.get('/tractors/my',               authMiddleware, requireManager, getMyTractors);
router.patch('/tractors/:id/status',     authMiddleware, requireManager, updateTractorStatus);
router.patch('/tractors/:id/implements', authMiddleware, requireManager, attachImplements);

// ── Hire requests (FAC manager) ───────────────────────────────────────────────
router.get('/requests',                         authMiddleware, requireManager, getHireRequests);
router.patch('/requests/:id/quote',             authMiddleware, requireManager, sendQuote);
router.patch('/requests/:id/confirm-payment',   authMiddleware, requireManager, confirmPaymentAndAssign);

// ── Deployments ───────────────────────────────────────────────────────────────
router.get('/deployments',                  authMiddleware, requireSuperAdmin, listAllDeployments);
router.get('/deployments/my',              authMiddleware, requireManager,    getMyDeployments);
router.patch('/deployments/:id/return',    authMiddleware, requireManager,    markTractorReturned);
router.patch('/deployments/:id/location',  authMiddleware, requireManager,    updateDeploymentLocation);

export default router;
