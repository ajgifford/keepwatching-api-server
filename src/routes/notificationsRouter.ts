import { dismissAllNotifications, dismissNotification, getNotifications } from '../controllers/notificationsController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import {
  accountIdParamSchema,
  dismissAllParamSchema,
  dismissParamSchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/notifications',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  getNotifications,
);

router.post(
  '/api/v1/accounts/:accountId/notifications/dismiss/:notificationId',
  validateSchema(dismissParamSchema, 'params'),
  authorizeAccountAccess,
  dismissNotification,
);

router.post(
  '/api/v1/accounts/:accountId/notifications/dismiss',
  validateSchema(dismissAllParamSchema, 'params'),
  authorizeAccountAccess,
  dismissAllNotifications,
);

export default router;
