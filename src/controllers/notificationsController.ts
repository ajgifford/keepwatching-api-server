import { AccountIdParam, DismissAllParams, DismissParams } from '@ajgifford/keepwatching-common-server/schema';
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
    const { accountId } = req.params as unknown as AccountIdParam;
    const notifications = await notificationsService.getNotifications(accountId);
    res.status(200).json({ message: 'Retrieved notifications for an account', notifications });
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
    const { accountId, notificationId } = req.params as unknown as DismissParams;
    const notifications = await notificationsService.dismissNotification(notificationId, accountId);
    res.status(200).json({ message: 'Dismissed notification for account', notifications });
  } catch (error) {
    next(error);
  }
});

/**
 * Dismiss all notifications for an account
 *
 * @route POST /api/v1/accounts/:accountId/notifications/dismiss
 */
export const dismissAllNotifications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params as unknown as DismissAllParams;
    const notifications = await notificationsService.dismissAllNotifications(accountId);
    res.status(200).json({ message: 'Dismissed all notifications for account', notifications });
  } catch (error) {
    next(error);
  }
});
