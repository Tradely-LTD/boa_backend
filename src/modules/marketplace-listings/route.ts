import { Router } from 'express';
import { authMiddleware, requireManager } from '../../middlewares/authMiddleware';
import {
  getListings, getFeaturedListings, getListing,
  getMyListings, createListing, updateListing, deleteListing, recordManualSale,
} from './controller';

export const marketplaceListingsRouter = Router();

// Public
marketplaceListingsRouter.get('/featured',    getFeaturedListings);
marketplaceListingsRouter.get('/',            getListings);
marketplaceListingsRouter.get('/:id',         getListing);

// Manager auth
marketplaceListingsRouter.get('/mine/all',    authMiddleware, requireManager, getMyListings);
marketplaceListingsRouter.post('/',           authMiddleware, requireManager, createListing);
marketplaceListingsRouter.patch('/:id',       authMiddleware, requireManager, updateListing);
marketplaceListingsRouter.delete('/:id',      authMiddleware, requireManager, deleteListing);
marketplaceListingsRouter.post('/:id/manual-sale', authMiddleware, requireManager, recordManualSale);
