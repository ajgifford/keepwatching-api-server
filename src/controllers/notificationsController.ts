import Notifications from '../models/notifications';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Pool } from 'mysql2/promise';
import { z } from 'zod';

const accountIdSchema = z.object({
  accountId: z.string().regex(/^\d+$/, 'Account ID must be numeric').transform(Number),
});

const dismissSchema = z.object({
  accountId: z.string().regex(/^\d+$/, 'Account ID must be numeric').transform(Number),
  notificationId: z.string().regex(/^\d+$/, 'Notification ID must be numeric').transform(Number),
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const params = accountIdSchema.parse(req.params);
  const notifications = await Notifications.getNotificationsForAccount(params.accountId);
  res.status(200).json({ message: 'Retrieved notifications for an account', results: notifications });
});

export const dismissNotification = asyncHandler(async (req: Request, res: Response) => {
  const params = dismissSchema.parse(req.params);
  await Notifications.dismissNotification(params.notificationId, params.accountId);
  res.status(200).json({ message: 'Notification dismissed successfully' });
});
