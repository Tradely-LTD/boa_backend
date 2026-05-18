/**
 * @module users
 * @depends authMiddleware, db/schemas/usersSchema
 * @routes /api/users
 */
export { default as usersRouter } from './route';
export * from './types';
