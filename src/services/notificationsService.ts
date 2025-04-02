import { dismissNotification, getNotificationsForAccount } from '../db/notificationDb';
import { errorService } from './errorService';

export class NotificationsService {
  public async getNotifications(accountId: number) {
    try {
      return await getNotificationsForAccount(accountId);
    } catch (error) {
      throw errorService.handleError(error, `getNotifications(${accountId})`);
    }
  }

  public async dismissNotification(notificationId: number, accountId: number) {
    try {
      await dismissNotification(notificationId, accountId);
    } catch (error) {
      throw errorService.handleError(error, `dismissNotification(${notificationId}, ${accountId})`);
    }
  }
}

export const notificationsService = new NotificationsService();
