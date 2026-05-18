/**
 * @module warehouse-receipts
 * @depends authMiddleware, requireManager, db/schemas/warehouseReceiptsSchema
 * @routes /api/warehouse-receipts
 */
export { default as warehouseReceiptsRouter } from './route';
