import {
  addProfile,
  deleteProfile,
  editAccount,
  editProfile,
  getProfile,
  getProfiles,
} from '@controllers/accountController';
import { accountService } from '@services/accountService';

jest.mock('@services/accountService');

describe('accountController', () => {
  let req: any, res: any, next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { accountId: '1', profileId: '123' },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getProfiles', () => {
    it('should return profiles for account', async () => {
      const mockProfiles = [
        { id: 11, name: 'Test Profile 1', image: 'profile1.jpg' },
        { id: 12, name: 'Test Profile 2', image: 'profile2.jpg' },
      ];

      (accountService.getProfiles as jest.Mock).mockResolvedValue(mockProfiles);

      await getProfiles(req, res, next);

      expect(accountService.getProfiles).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved profiles for account 1',
        results: mockProfiles,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to get profiles');
      (accountService.getProfiles as jest.Mock).mockRejectedValue(error);

      await getProfiles(req, res, next);

      expect(accountService.getProfiles).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should retrieve profile with all related content', async () => {
      const mockProfileData = {
        profile: { id: 123, name: 'Test Profile', image: 'profile.jpg' },
        shows: [{ show_id: 1, title: 'Show 1' }],
        recentEpisodes: [{ episode_id: 1, title: 'Recent Episode' }],
        upcomingEpisodes: [{ episode_id: 2, title: 'Upcoming Episode' }],
        nextUnwatchedEpisodes: [{ show_id: 1, episodes: [{ episode_id: 3 }] }],
        movies: [{ movie_id: 1, title: 'Movie 1' }],
        recentMovies: [{ movie_id: 2, title: 'Recent Movie' }],
        upcomingMovies: [{ movie_id: 3, title: 'Upcoming Movie' }],
      };

      (accountService.getProfile as jest.Mock).mockResolvedValue(mockProfileData);

      await getProfile(req, res, next);

      expect(accountService.getProfile).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved profile with id: 123',
        results: mockProfileData,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Profile not found');
      (accountService.getProfile as jest.Mock).mockRejectedValue(error);

      await getProfile(req, res, next);

      expect(accountService.getProfile).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('editAccount', () => {
    it('should edit account successfully', async () => {
      req.body = { name: 'Updated Account Name', defaultProfileId: 12 };
      const mockUpdatedAccount = {
        id: 1,
        name: 'Updated Account Name',
        email: 'test@example.com',
        image: 'account.jpg',
        default_profile_id: 12,
      };

      (accountService.editAccount as jest.Mock).mockResolvedValue(mockUpdatedAccount);

      await editAccount(req, res, next);

      expect(accountService.editAccount).toHaveBeenCalledWith(1, 'Updated Account Name', 12);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Updated account 1',
        result: mockUpdatedAccount,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.body = { name: 'Updated Account Name', defaultProfileId: 12 };
      const error = new Error('Account not found');
      (accountService.editAccount as jest.Mock).mockRejectedValue(error);

      await editAccount(req, res, next);

      expect(accountService.editAccount).toHaveBeenCalledWith(1, 'Updated Account Name', 12);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('addProfile', () => {
    it('should add a profile successfully', async () => {
      req.body = { name: 'New Profile' };
      const mockNewProfile = {
        id: 13,
        name: 'New Profile',
        image: 'default-profile.jpg',
      };

      (accountService.addProfile as jest.Mock).mockResolvedValue(mockNewProfile);

      await addProfile(req, res, next);

      expect(accountService.addProfile).toHaveBeenCalledWith(1, 'New Profile');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profile added successfully',
        result: mockNewProfile,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.body = { name: 'New Profile' };
      const error = new Error('Failed to add profile');
      (accountService.addProfile as jest.Mock).mockRejectedValue(error);

      await addProfile(req, res, next);

      expect(accountService.addProfile).toHaveBeenCalledWith(1, 'New Profile');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('editProfile', () => {
    it('should edit a profile successfully', async () => {
      req.body = { name: 'Updated Profile Name' };
      const mockUpdatedProfile = {
        id: 123,
        name: 'Updated Profile Name',
        image: 'profile.jpg',
      };

      (accountService.editProfile as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      await editProfile(req, res, next);

      expect(accountService.editProfile).toHaveBeenCalledWith(123, 'Updated Profile Name');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profile edited successfully',
        result: mockUpdatedProfile,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.body = { name: 'Updated Profile Name' };
      const error = new Error('Profile not found');
      (accountService.editProfile as jest.Mock).mockRejectedValue(error);

      await editProfile(req, res, next);

      expect(accountService.editProfile).toHaveBeenCalledWith(123, 'Updated Profile Name');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteProfile', () => {
    it('should delete a profile successfully', async () => {
      (accountService.deleteProfile as jest.Mock).mockResolvedValue(true);

      await deleteProfile(req, res, next);

      expect(accountService.deleteProfile).toHaveBeenCalledWith(123, 1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile deleted successfully' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Profile not found');
      (accountService.deleteProfile as jest.Mock).mockRejectedValue(error);

      await deleteProfile(req, res, next);

      expect(accountService.deleteProfile).toHaveBeenCalledWith(123, 1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
