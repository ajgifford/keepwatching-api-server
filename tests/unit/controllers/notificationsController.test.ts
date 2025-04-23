import { notificationsService } from '@ajgifford/keepwatching-common-server/services';
import { dismissNotification, getNotifications } from '@controllers/notificationsController';

jest.mock('@ajgifford/keepwatching-common-server/services/notificationsService');

describe('notificationsController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { accountId: '1', notificationId: '123' },
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
          notification_id: 123, 
          message: 'New episode available', 
          start_date: '2025-04-01T00:00:00Z',
          end_date: '2025-04-30T00:00:00Z',
          dismissed: false
        },
        { 
          notification_id: 124, 
          message: 'New update available', 
          start_date: '2025-04-10T00:00:00Z',
          end_date: '2025-05-10T00:00:00Z',
          dismissed: true
        }
      ];
      
      (notificationsService.getNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      await getNotifications(req, res, next);

      expect(notificationsService.getNotifications).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved notifications for an account',
        results: mockNotifications,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty notifications array', async () => {
      const mockNotifications: any[] = [];
      
      (notificationsService.getNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      await getNotifications(req, res, next);

      expect(notificationsService.getNotifications).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved notifications for an account',
        results: [],
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
      (notificationsService.dismissNotification as jest.Mock).mockResolvedValue(true);

      await dismissNotification(req, res, next);

      expect(notificationsService.dismissNotification).toHaveBeenCalledWith(123, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notification dismissed successfully',
      });
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
