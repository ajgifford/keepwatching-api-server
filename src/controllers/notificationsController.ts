import { AccountIdParam, DismissParams } from '@ajgifford/keepwatching-common-server/schema';
import { notificationsService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

/**
 * Get notifications for an account
 *
 * @route GET /api/v1/accounts/:accountId/notifications
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params as AccountIdParam;
    const notifications = await notificationsService.getNotifications(Number(accountId));
    res.status(200).json({ message: 'Retrieved notifications for an account', results: notifications });
  } catch (error) {
    next(error);
  }
});

/**
 * Dismiss a notification for an account
 *
 * @route POST /api/v1/accounts/:accountId/notifications/dismiss/:notificationId
 */
export const dismissNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, notificationId } = req.params as DismissParams;
    await notificationsService.dismissNotification(Number(notificationId), Number(accountId));
    res.status(200).json({ message: 'Notification dismissed successfully' });
  } catch (error) {
    next(error);
  }
});
