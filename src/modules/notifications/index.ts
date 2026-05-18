/**
 * @module notifications
 * @depends authMiddleware, db/schemas/notificationsSchema
 * @routes /api/notifications
 */
export { default as notificationsRouter } from './route';
export { createNotification } from './controller';
