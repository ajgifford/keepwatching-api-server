import {
  dismissAllNotifications,
  dismissNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationsController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
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
  validateSchema(accountIdParamSchema, 'params'),
  validateSchema(dismissedQuerySchema, 'query'),
  authorizeAccountAccess,
  getNotifications,
);

router.post(
  '/api/v1/accounts/:accountId/notifications/read/:notificationId',
  validateSchema(notificationActionParamSchema, 'params'),
  validateSchema(readStatusQuerySchema, 'query'),
  authorizeAccountAccess,
  markNotificationRead,
);

router.post(
  '/api/v1/accounts/:accountId/notifications/read',
  validateSchema(accountIdParamSchema, 'params'),
  validateSchema(readStatusQuerySchema, 'query'),
  authorizeAccountAccess,
  markAllNotificationsRead,
);

router.post(
  '/api/v1/accounts/:accountId/notifications/dismiss/:notificationId',
  validateSchema(notificationActionParamSchema, 'params'),
  validateSchema(dismissedQuerySchema, 'query'),
  authorizeAccountAccess,
  dismissNotification,
);

router.post(
  '/api/v1/accounts/:accountId/notifications/dismiss',
  validateSchema(accountIdParamSchema, 'params'),
  validateSchema(dismissedQuerySchema, 'query'),
  authorizeAccountAccess,
  dismissAllNotifications,
);

export default router;
