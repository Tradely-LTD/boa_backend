/**
 * @module analytics
 * @depends authMiddleware, db/schemas/applicationsSchema, db/schemas/aggregationCentresSchema
 * @routes /api/analytics
 */
export { default as analyticsRouter } from './route';
