import { dismissNotification, getNotifications } from '../controllers/notificationsController';
import { validateSchema } from '../middleware/validationMiddleware';
import { accountIdParamSchema, dismissParamSchema } from '../schema/notificationsSchema';
import express from 'express';

const router = express.Router();

router.get('/api/v1/notifications/:accountId', validateSchema(accountIdParamSchema, 'params'), getNotifications);
router.post(
  '/api/v1/notifications/:accountId/dismiss/:notificationId',
  validateSchema(dismissParamSchema, 'params'),
  dismissNotification,
);

export default router;
