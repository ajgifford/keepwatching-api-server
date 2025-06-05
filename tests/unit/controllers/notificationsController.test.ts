import { notificationsService } from '@ajgifford/keepwatching-common-server/testing';
import { NotificationResponse } from '@ajgifford/keepwatching-types';
import { dismissNotification, getNotifications } from '@controllers/notificationsController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({ notificationsService: notificationsService }));

describe('notificationsController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { accountId: 1, notificationId: 123 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should retrieve notifications successfully', async () => {
      const mockNotifications = [
        {
          id: 123,
          message: 'New episode available',
          startDate: new Date('2025-04-01T00:00:00Z'),
          endDate: new Date('2025-04-30T00:00:00Z'),
        },
        {
          id: 124,
          message: 'New update available',
          startDate: new Date('2025-04-10T00:00:00Z'),
          endDate: new Date('2025-05-10T00:00:00Z'),
        },
      ];

      const response: NotificationResponse = {
        message: 'Retrieved notifications for an account',
        notifications: mockNotifications,
      };

      (notificationsService.getNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      await getNotifications(req, res, next);

      expect(notificationsService.getNotifications).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(response);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty notifications array', async () => {
      (notificationsService.getNotifications as jest.Mock).mockResolvedValue([]);

      await getNotifications(req, res, next);

      expect(notificationsService.getNotifications).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved notifications for an account',
        notifications: [],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      const error = new Error('Failed to get notifications');
      (notificationsService.getNotifications as jest.Mock).mockRejectedValue(error);

      await getNotifications(req, res, next);

      expect(notificationsService.getNotifications).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('dismissNotification', () => {
    it('should dismiss a notification successfully', async () => {
      const mockNotifications = [
        {
          id: 123,
          message: 'New episode available',
          startDate: new Date('2025-04-01T00:00:00Z'),
          endDate: new Date('2025-04-30T00:00:00Z'),
        },
        {
          id: 124,
          message: 'New update available',
          startDate: new Date('2025-04-10T00:00:00Z'),
          endDate: new Date('2025-05-10T00:00:00Z'),
        },
      ];

      const response: NotificationResponse = {
        message: 'Dismissed notification for account',
        notifications: mockNotifications,
      };

      (notificationsService.dismissNotification as jest.Mock).mockResolvedValue(mockNotifications);

      await dismissNotification(req, res, next);

      expect(notificationsService.dismissNotification).toHaveBeenCalledWith(123, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(response);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when dismissing a notification', async () => {
      const error = new Error('Failed to dismiss notification');
      (notificationsService.dismissNotification as jest.Mock).mockRejectedValue(error);

      await dismissNotification(req, res, next);

      expect(notificationsService.dismissNotification).toHaveBeenCalledWith(123, 1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle non-existent notification', async () => {
      const error = new Error('Notification not found');
      (notificationsService.dismissNotification as jest.Mock).mockRejectedValue(error);

      await dismissNotification(req, res, next);

      expect(notificationsService.dismissNotification).toHaveBeenCalledWith(123, 1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
