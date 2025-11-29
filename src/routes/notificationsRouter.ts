import {
  dismissAllNotifications,
  dismissNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationsController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  accountIdParamSchema,
  dismissedQuerySchema,
  notificationActionParamSchema,
  readStatusQuerySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/notifications',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  validateSchema(dismissedQuerySchema, 'query'),
  authorizeAccountAccess,
  trackAccountActivity,
  getNotifications,
);

router.post(
  '/api/v1/accounts/:accountId/notifications/read/:notificationId',
  logRequestContext,
  validateSchema(notificationActionParamSchema, 'params'),
  validateSchema(readStatusQuerySchema, 'query'),
  authorizeAccountAccess,
  trackAccountActivity,
  markNotificationRead,
);

router.post(
  '/api/v1/accounts/:accountId/notifications/read',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  validateSchema(readStatusQuerySchema, 'query'),
  authorizeAccountAccess,
  trackAccountActivity,
  markAllNotificationsRead,
);

router.post(
  '/api/v1/accounts/:accountId/notifications/dismiss/:notificationId',
  logRequestContext,
  validateSchema(notificationActionParamSchema, 'params'),
  validateSchema(dismissedQuerySchema, 'query'),
  authorizeAccountAccess,
  trackAccountActivity,
  dismissNotification,
);

router.post(
  '/api/v1/accounts/:accountId/notifications/dismiss',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  validateSchema(dismissedQuerySchema, 'query'),
  authorizeAccountAccess,
  trackAccountActivity,
  dismissAllNotifications,
);

export default router;
