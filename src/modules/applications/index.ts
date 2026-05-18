/**
 * @module applications
 * @depends authMiddleware, db/schemas/applicationsSchema, db/schemas/aggregationCentresSchema
 * @routes /api/applications
 */
export { default as applicationsRouter } from './route';
export * from './types';
