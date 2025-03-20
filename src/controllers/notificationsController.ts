import Notifications from '../models/notifications';
import { AccountIdParams, DismissParams } from '../schema/notificationsSchema';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

export const getNotifications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params as AccountIdParams;
    const notifications = await Notifications.getNotificationsForAccount(Number(accountId));
    res.status(200).json({ message: 'Retrieved notifications for an account', results: notifications });
  } catch (error) {
    next(error);
  }
});

export const dismissNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, notificationId } = req.params as DismissParams;
    await Notifications.dismissNotification(Number(notificationId), Number(accountId));
    res.status(200).json({ message: 'Notification dismissed successfully' });
  } catch (error) {
    next(error);
  }
});
