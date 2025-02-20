import { dismissNotification, getNotifications } from '../controllers/notificationsController';
import express from 'express';

const router = express.Router();

router.get('/api/v1/notifications/:accountId', getNotifications);
router.post('/api/v1/notifications/:accountId/dismiss/:notificationId', dismissNotification);

export default router;
