import { dismissNotification, getNotifications } from '../controllers/notificationsController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server/middleware/validationMiddleware';
import { accountIdParamSchema } from '@ajgifford/keepwatching-common-server/schema/accountSchema';
import { dismissParamSchema } from '@ajgifford/keepwatching-common-server/schema/notificationsSchema';
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

export default router;
