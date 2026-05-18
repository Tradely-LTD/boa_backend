import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger';

import { authRouter }               from './modules/auth';
import { applicationsRouter }       from './modules/applications';
import { aggregationCentresRouter } from './modules/aggregation-centres';
import { usersRouter }              from './modules/users';
import { analyticsRouter }          from './modules/analytics';
import { exportRouter }             from './modules/export';
import { notificationsRouter }      from './modules/notifications';
import { commodityIntakeRouter }    from './modules/commodity-intake';
import { warehouseReceiptsRouter }  from './modules/warehouse-receipts';
import { loanApplicationsRouter }   from './modules/loan-applications';
import { inventoryRouter }          from './modules/inventory';
import { suppliersRouter }          from './modules/suppliers';
import { farmInputsRouter }         from './modules/farm-inputs';
import { collectionRequestsRouter }      from './modules/collection-requests';
import { marketplaceListingsRouter }     from './modules/marketplace-listings';
import { marketplaceBuyersRouter }       from './modules/marketplace-buyers';
import { marketplaceOrdersRouter }       from './modules/marketplace-orders';
import { marketplacePaymentsRouter }     from './modules/marketplace-payments';
import { marketplaceUploadsRouter }      from './modules/marketplace-uploads';

const app  = express();
const PORT = process.env.PORT ?? 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Root / Health ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.json({ status: 'ok', service: 'boa-backend', version: '1.0.0', ts: new Date().toISOString() }),
);
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'boa-backend', ts: new Date().toISOString() }),
);

// ── API Docs ──────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'BOA AgriHub API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',                authRouter);
app.use('/api/applications',        applicationsRouter);
app.use('/api/aggregation-centres', aggregationCentresRouter);
app.use('/api/users',               usersRouter);
app.use('/api/analytics',           analyticsRouter);
app.use('/api/export',              exportRouter);
app.use('/api/notifications',       notificationsRouter);
app.use('/api/commodity-intake',    commodityIntakeRouter);
app.use('/api/warehouse-receipts',  warehouseReceiptsRouter);
app.use('/api/loan-applications',   loanApplicationsRouter);
app.use('/api/inventory',           inventoryRouter);
app.use('/api/suppliers',           suppliersRouter);
app.use('/api/farm-inputs',         farmInputsRouter);
app.use('/api/collection-requests',       collectionRequestsRouter);

// ── Marketplace ────────────────────────────────────────────────────────────────
app.use('/api/marketplace/listings',      marketplaceListingsRouter);
app.use('/api/marketplace/buyers',        marketplaceBuyersRouter);
app.use('/api/marketplace/orders',        marketplaceOrdersRouter);
app.use('/api/marketplace/payments',      marketplacePaymentsRouter);
app.use('/api/marketplace/uploads',       marketplaceUploadsRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  BOA backend running on http://localhost:${PORT}`);
});

export default app;
