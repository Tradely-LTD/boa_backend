/**
 * @module auth
 * @depends middlewares/authMiddleware, db/schemas/usersSchema
 * @routes /api/auth
 */
export { default as authRouter } from './route';
export * from './types';
