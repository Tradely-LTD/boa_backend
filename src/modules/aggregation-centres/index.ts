/**
 * @module aggregation-centres
 * @depends authMiddleware, db/schemas/aggregationCentresSchema
 * @routes /api/aggregation-centres
 */
export { default as aggregationCentresRouter } from './route';
export * from './types';
