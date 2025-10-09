import { preferencesService } from '@ajgifford/keepwatching-common-server/services';
import {
  getAccountPreferences,
  getAccountPreferencesByType,
  updateMultiplePreferences,
  updatePreferences,
} from '@controllers/preferencesController';

// Mock the external packages
jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  preferencesService: {
    getAccountPreferences: jest.fn(),
    getPreferencesByType: jest.fn(),
    updatePreferences: jest.fn(),
    updateMultiplePreferences: jest.fn(),
  },
}));

jest.mock('@ajgifford/keepwatching-common-server/schema', () => ({
  getPreferenceBodySchema: jest.fn(() => ({
    parse: jest.fn((data) => data),
  })),
}));

describe('preferencesController', () => {
  let req: any, res: any, next: jest.Mock;

  const mockPreferences = {
    accountId: 123,
    emailNotifications: true,
    pushNotifications: false,
    theme: 'dark',
    language: 'en',
  };

  const mockPreferencesByType = {
    emailNotifications: true,
    pushNotifications: false,
  };

  beforeEach(() => {
    req = {
      params: { accountId: 123, preferenceType: 'notifications' },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getAccountPreferences', () => {
    it('should retrieve account preferences successfully', async () => {
      (preferencesService.getAccountPreferences as jest.Mock).mockResolvedValue(mockPreferences);

      await getAccountPreferences(req, res, next);

      expect(preferencesService.getAccountPreferences).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account preferences retrieved successfully',
        preferences: mockPreferences,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when retrieving account preferences', async () => {
      const error = new Error('Preferences not found');
      (preferencesService.getAccountPreferences as jest.Mock).mockRejectedValue(error);

      await getAccountPreferences(req, res, next);

      expect(preferencesService.getAccountPreferences).toHaveBeenCalledWith(123);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle database connection errors', async () => {
      const error = new Error('Database connection error');
      (preferencesService.getAccountPreferences as jest.Mock).mockRejectedValue(error);

      await getAccountPreferences(req, res, next);

      expect(preferencesService.getAccountPreferences).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAccountPreferencesByType', () => {
    it('should retrieve account preferences by type successfully', async () => {
      (preferencesService.getPreferencesByType as jest.Mock).mockResolvedValue(mockPreferencesByType);

      await getAccountPreferencesByType(req, res, next);

      expect(preferencesService.getPreferencesByType).toHaveBeenCalledWith(123, 'notifications');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account preferences retrieved successfully',
        preferences: mockPreferencesByType,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when retrieving preferences by type', async () => {
      const error = new Error('Preferences type not found');
      (preferencesService.getPreferencesByType as jest.Mock).mockRejectedValue(error);

      await getAccountPreferencesByType(req, res, next);

      expect(preferencesService.getPreferencesByType).toHaveBeenCalledWith(123, 'notifications');
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle invalid preference type', async () => {
      req.params.preferenceType = 'invalid_type';
      const error = new Error('Invalid preference type');
      (preferencesService.getPreferencesByType as jest.Mock).mockRejectedValue(error);

      await getAccountPreferencesByType(req, res, next);

      expect(preferencesService.getPreferencesByType).toHaveBeenCalledWith(123, 'invalid_type');
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences successfully', async () => {
      req.body = { emailNotifications: true, pushNotifications: false };
      const updatedPreferences = { ...mockPreferencesByType, emailNotifications: true };

      (preferencesService.updatePreferences as jest.Mock).mockResolvedValue(updatedPreferences);

      await updatePreferences(req, res, next);

      expect(preferencesService.updatePreferences).toHaveBeenCalledWith(123, 'notifications', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account preferences updated successfully',
        preferences: updatedPreferences,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when updating preferences', async () => {
      req.body = { emailNotifications: true };
      const error = new Error('Update failed');
      (preferencesService.updatePreferences as jest.Mock).mockRejectedValue(error);

      await updatePreferences(req, res, next);

      expect(preferencesService.updatePreferences).toHaveBeenCalledWith(123, 'notifications', req.body);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle validation errors', async () => {
      req.body = { invalidField: 'value' };
      const error = new Error('Validation error');
      (preferencesService.updatePreferences as jest.Mock).mockRejectedValue(error);

      await updatePreferences(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should update single preference field', async () => {
      req.body = { emailNotifications: false };
      const updatedPreferences = { ...mockPreferencesByType, emailNotifications: false };

      (preferencesService.updatePreferences as jest.Mock).mockResolvedValue(updatedPreferences);

      await updatePreferences(req, res, next);

      expect(preferencesService.updatePreferences).toHaveBeenCalledWith(123, 'notifications', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account preferences updated successfully',
        preferences: updatedPreferences,
      });
    });
  });

  describe('updateMultiplePreferences', () => {
    it('should update multiple preferences successfully', async () => {
      req.body = {
        notifications: { emailNotifications: true, pushNotifications: true },
        display: { theme: 'light', language: 'es' },
      };

      const updatedPreferences = {
        ...mockPreferences,
        emailNotifications: true,
        pushNotifications: true,
        theme: 'light',
        language: 'es',
      };

      (preferencesService.updateMultiplePreferences as jest.Mock).mockResolvedValue(updatedPreferences);

      await updateMultiplePreferences(req, res, next);

      expect(preferencesService.updateMultiplePreferences).toHaveBeenCalledWith(123, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account preferences updated successfully',
        preferences: updatedPreferences,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when updating multiple preferences', async () => {
      req.body = {
        notifications: { emailNotifications: true },
      };
      const error = new Error('Batch update failed');
      (preferencesService.updateMultiplePreferences as jest.Mock).mockRejectedValue(error);

      await updateMultiplePreferences(req, res, next);

      expect(preferencesService.updateMultiplePreferences).toHaveBeenCalledWith(123, req.body);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle partial updates', async () => {
      req.body = {
        notifications: { emailNotifications: false },
      };

      const updatedPreferences = {
        ...mockPreferences,
        emailNotifications: false,
      };

      (preferencesService.updateMultiplePreferences as jest.Mock).mockResolvedValue(updatedPreferences);

      await updateMultiplePreferences(req, res, next);

      expect(preferencesService.updateMultiplePreferences).toHaveBeenCalledWith(123, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account preferences updated successfully',
        preferences: updatedPreferences,
      });
    });

    it('should handle empty update body', async () => {
      req.body = {};

      (preferencesService.updateMultiplePreferences as jest.Mock).mockResolvedValue(mockPreferences);

      await updateMultiplePreferences(req, res, next);

      expect(preferencesService.updateMultiplePreferences).toHaveBeenCalledWith(123, {});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account preferences updated successfully',
        preferences: mockPreferences,
      });
    });

    it('should handle database transaction errors', async () => {
      req.body = {
        notifications: { emailNotifications: true },
        display: { theme: 'dark' },
      };
      const error = new Error('Transaction rollback');
      (preferencesService.updateMultiplePreferences as jest.Mock).mockRejectedValue(error);

      await updateMultiplePreferences(req, res, next);

      expect(preferencesService.updateMultiplePreferences).toHaveBeenCalledWith(123, req.body);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
