import { notificationsService } from '@ajgifford/keepwatching-common-server/services';
import { NotificationResponse } from '@ajgifford/keepwatching-types';
import {
  dismissAllNotifications,
  dismissNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@controllers/notificationsController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  notificationsService: {
    getNotifications: jest.fn(),
    markNotificationRead: jest.fn(),
    markAllNotificationsRead: jest.fn(),
    dismissNotification: jest.fn(),
    dismissAllNotifications: jest.fn(),
  },
}));

describe('notificationsController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { accountId: 1, notificationId: 123 },
      query: {},
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

      expect(notificationsService.getNotifications).toHaveBeenCalledWith(1, false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(response);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty notifications array', async () => {
      (notificationsService.getNotifications as jest.Mock).mockResolvedValue([]);

      await getNotifications(req, res, next);

      expect(notificationsService.getNotifications).toHaveBeenCalledWith(1, false);
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

      expect(notificationsService.getNotifications).toHaveBeenCalledWith(1, false);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('markNotificationRead', () => {
    it('should mark a notification read successfully', async () => {
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
        message: 'Marked notification read for account',
        notifications: mockNotifications,
      };

      (notificationsService.markNotificationRead as jest.Mock).mockResolvedValue(mockNotifications);

      await markNotificationRead(req, res, next);

      expect(notificationsService.markNotificationRead).toHaveBeenCalledWith(123, 1, false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(response);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when marking a notification read', async () => {
      const error = new Error('Failed to mark notification read');
      (notificationsService.markNotificationRead as jest.Mock).mockRejectedValue(error);

      await markNotificationRead(req, res, next);

      expect(notificationsService.markNotificationRead).toHaveBeenCalledWith(123, 1, false);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle non-existent notification', async () => {
      const error = new Error('Notification not found');
      (notificationsService.markNotificationRead as jest.Mock).mockRejectedValue(error);

      await markNotificationRead(req, res, next);

      expect(notificationsService.markNotificationRead).toHaveBeenCalledWith(123, 1, false);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('markAllNotificationsRead', () => {
    it('should mark all notifications read successfully', async () => {
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
        message: 'Marked all notifications read for account',
        notifications: mockNotifications,
      };

      (notificationsService.markAllNotificationsRead as jest.Mock).mockResolvedValue(mockNotifications);

      await markAllNotificationsRead(req, res, next);

      expect(notificationsService.markAllNotificationsRead).toHaveBeenCalledWith(1, false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(response);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when marking all notifications read', async () => {
      const error = new Error('Failed to mark all notifications read');
      (notificationsService.markAllNotificationsRead as jest.Mock).mockRejectedValue(error);

      await markAllNotificationsRead(req, res, next);

      expect(notificationsService.markAllNotificationsRead).toHaveBeenCalledWith(1, false);
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

      expect(notificationsService.dismissNotification).toHaveBeenCalledWith(123, 1, false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(response);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when dismissing a notification', async () => {
      const error = new Error('Failed to dismiss notification');
      (notificationsService.dismissNotification as jest.Mock).mockRejectedValue(error);

      await dismissNotification(req, res, next);

      expect(notificationsService.dismissNotification).toHaveBeenCalledWith(123, 1, false);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle non-existent notification', async () => {
      const error = new Error('Notification not found');
      (notificationsService.dismissNotification as jest.Mock).mockRejectedValue(error);

      await dismissNotification(req, res, next);

      expect(notificationsService.dismissNotification).toHaveBeenCalledWith(123, 1, false);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('dismissAllNotifications', () => {
    it('should dismiss all notifications successfully', async () => {
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
        message: 'Dismissed all notifications for account',
        notifications: mockNotifications,
      };

      (notificationsService.dismissAllNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      await dismissAllNotifications(req, res, next);

      expect(notificationsService.dismissAllNotifications).toHaveBeenCalledWith(1, false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(response);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when dismissing all notifications', async () => {
      const error = new Error('Failed to dismiss all notifications');
      (notificationsService.dismissAllNotifications as jest.Mock).mockRejectedValue(error);

      await dismissAllNotifications(req, res, next);

      expect(notificationsService.dismissAllNotifications).toHaveBeenCalledWith(1, false);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
