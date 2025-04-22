import { AccountIdParam } from '@ajgifford/keepwatching-common-server/schema/accountSchema';
import { DismissParams } from '@ajgifford/keepwatching-common-server/schema/notificationsSchema';
import { notificationsService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

export const getNotifications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params as AccountIdParam;
    const notifications = await notificationsService.getNotifications(Number(accountId));
    res.status(200).json({ message: 'Retrieved notifications for an account', results: notifications });
  } catch (error) {
    next(error);
  }
});

export const dismissNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, notificationId } = req.params as DismissParams;
    await notificationsService.dismissNotification(Number(notificationId), Number(accountId));
    res.status(200).json({ message: 'Notification dismissed successfully' });
  } catch (error) {
    next(error);
  }
});
