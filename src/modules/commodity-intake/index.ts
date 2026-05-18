/**
 * @module commodity-intake
 * @depends authMiddleware, requireManager, db/schemas/commodityIntakesSchema
 * @routes /api/commodity-intake
 */
export { default as commodityIntakeRouter } from './route';
