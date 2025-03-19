import {
  addProfile,
  deleteProfile,
  editAccount,
  editProfile,
  getProfile,
  getProfiles,
} from '@controllers/accountController';
import Account from '@models/account';
import Episode from '@models/episode';
import Movie from '@models/movie';
import Profile from '@models/profile';
import Show from '@models/show';

jest.mock('@models/profile');
jest.mock('@models/account');
jest.mock('@models/show');
jest.mock('@models/movie');
jest.mock('@models/episode');
jest.mock('@utils/imageUtility', () => ({
  getProfileImage: jest.fn().mockReturnValue('mock-profile-image-url.jpg'),
  getAccountImage: jest.fn().mockReturnValue('mock-account-image-url.jpg'),
}));

describe('accountController', () => {
  describe('editAccount', () => {
    let req: any, res: any, next: any;

    beforeEach(() => {
      req = { params: { id: '1' }, body: { account_name: 'Updated Account 1', default_profile_id: 12 } };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      next = jest.fn();

      jest.restoreAllMocks();
    });

    it('should edit account', async () => {
      const mockAccount = {
        account_id: 1,
        account_name: 'Original Account 1',
        email: 'test@example.com',
        uid: 'uid123',
        default_profile_id: 11,
        editAccount: jest.fn(),
      };

      const mockUpdatedAccount = {
        account_id: 1,
        account_name: 'Updated Account 1',
        email: 'test@example.com',
        uid: 'uid123',
        default_profile_id: 12,
      };

      (Account.findById as jest.Mock).mockResolvedValue(mockAccount);
      mockAccount.editAccount.mockResolvedValue(mockUpdatedAccount);

      await editAccount(req, res, next);

      expect(Account.findById).toHaveBeenCalledWith(1);
      expect(mockAccount.editAccount).toHaveBeenCalledWith('Updated Account 1', 12);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Updated account 1',
        result: {
          id: 1,
          name: 'Updated Account 1',
          email: 'test@example.com',
          image: 'mock-account-image-url.jpg',
          default_profile_id: 12,
        },
      });
    });

    it('should handle account not found', async () => {
      (Account.findById as jest.Mock).mockResolvedValue(null);

      await editAccount(req, res, next);

      expect(Account.findById).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Account not found' }));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle update failure', async () => {
      const mockAccount = {
        account_id: 1,
        account_name: 'Original Account 1',
        email: 'test@example.com',
        uid: 'uid123',
        default_profile_id: 11,
        editAccount: jest.fn().mockResolvedValue(null),
      };

      (Account.findById as jest.Mock).mockResolvedValue(mockAccount);

      await editAccount(req, res, next);

      expect(Account.findById).toHaveBeenCalledWith(1);
      expect(mockAccount.editAccount).toHaveBeenCalledWith('Updated Account 1', 12);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to update the account' }));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle if a database exception occurs', async () => {
      const dbError = new Error('Database error');
      const mockAccount = {
        account_id: 1,
        account_name: 'Original Account 1',
        email: 'test@example.com',
        uid: 'uid123',
        default_profile_id: 11,
        editAccount: jest.fn().mockRejectedValue(dbError),
      };

      (Account.findById as jest.Mock).mockResolvedValue(mockAccount);

      await editAccount(req, res, next);

      expect(Account.findById).toHaveBeenCalledWith(1);
      expect(mockAccount.editAccount).toHaveBeenCalledWith('Updated Account 1', 12);
      expect(next).toHaveBeenCalledWith(dbError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('addProfile', () => {
    let req: any, res: any, next: any;

    beforeEach(() => {
      req = { params: { id: '1' }, body: { name: 'Added Profile 12' } };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      next = jest.fn();

      jest.restoreAllMocks();
    });

    it('should add a profile', async () => {
      const mockProfile = {
        account_id: 1,
        name: 'Added Profile 12',
        id: undefined,
        save: jest.fn().mockImplementation(function (this: any) {
          this.id = 12;
          return Promise.resolve();
        }),
        delete: jest.fn(),
        update: jest.fn(),
        updateProfileImage: jest.fn(),
      };

      (Profile as jest.MockedClass<typeof Profile>).mockImplementation(() => mockProfile);
      await addProfile(req, res, next);

      expect(Profile).toHaveBeenCalledWith(1, 'Added Profile 12');
      expect(mockProfile.save).toHaveBeenCalledWith();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profile added successfully',
        result: {
          id: 12,
          name: 'Added Profile 12',
          image: 'mock-profile-image-url.jpg',
        },
      });
    });

    it('should handle profile creation failure', async () => {
      const mockProfile = {
        account_id: 1,
        name: 'Added Profile 12',
        id: undefined,
        save: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn(),
        update: jest.fn(),
        updateProfileImage: jest.fn(),
      };

      (Profile as jest.MockedClass<typeof Profile>).mockImplementation(() => mockProfile);
      await addProfile(req, res, next);

      expect(Profile).toHaveBeenCalledWith(1, 'Added Profile 12');
      expect(mockProfile.save).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to add a profile' }));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle if a database error occurs', async () => {
      const dbError = new Error('Database error');

      const mockProfile = {
        account_id: 1,
        name: 'Added Profile 12',
        id: undefined,
        save: jest.fn().mockRejectedValue(dbError),
        delete: jest.fn(),
        update: jest.fn(),
        updateProfileImage: jest.fn(),
      };

      (Profile as jest.MockedClass<typeof Profile>).mockImplementation(() => mockProfile);
      await addProfile(req, res, next);

      expect(Profile).toHaveBeenCalledWith(1, 'Added Profile 12');
      expect(mockProfile.save).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(dbError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('editProfile', () => {
    let req: any, res: any, next: any;

    beforeEach(() => {
      req = { params: { id: '1', profileId: '11' }, body: { name: 'Edit Profile 11' } };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      next = jest.fn();

      jest.restoreAllMocks();
    });

    it('should edit a profile successfully 2', async () => {
      const mockProfile = {
        id: 11,
        name: 'Profile 11',
        update: jest.fn().mockImplementation(function () {
          return Promise.resolve({ id: 11, name: 'Edit Profile 11' });
        }),
      };
      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);

      await editProfile(req, res, next);

      expect(mockProfile.update).toHaveBeenCalledWith('Edit Profile 11');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profile edited successfully',
        result: {
          id: 11,
          name: 'Edit Profile 11',
          image: 'mock-profile-image-url.jpg',
        },
      });
    });

    it('should handle if the profile is not found', async () => {
      (Profile.findById as jest.Mock).mockResolvedValue(null);

      await editProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Profile not found' }));
    });

    it('should handle if profile update fails', async () => {
      const mockProfile = { id: 11, update: jest.fn().mockResolvedValue(false) };
      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);

      await editProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to update profile' }));
    });

    it('should handle if a database exception occurs', async () => {
      const dbError = new Error('Database error');
      (Profile.findById as jest.Mock).mockRejectedValue(dbError);

      await editProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe('deleteProfile', () => {
    let req: any, res: any, next: any;

    beforeEach(() => {
      req = { params: { id: '1', profileId: '11' } };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();

      jest.restoreAllMocks();
    });

    it('should delete a profile successfully', async () => {
      const mockProfile = { id: 11, delete: jest.fn().mockResolvedValue(true) };
      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);

      await deleteProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile deleted successfully' });
      expect(mockProfile.delete).toHaveBeenCalled();
    });

    it('should handle if the profile is not found', async () => {
      (Profile.findById as jest.Mock).mockResolvedValue(null);

      await deleteProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Profile not found' }));
    });

    it('should handle if profile deletion fails', async () => {
      const mockProfile = { id: 11, delete: jest.fn().mockResolvedValue(false) };
      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);

      await deleteProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to delete profile' }));
    });

    it('should handle if a database exception occurs', async () => {
      const dbError = new Error('Database error');
      (Profile.findById as jest.Mock).mockRejectedValue(dbError);

      await deleteProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe('getProfiles', () => {
    let req: any, res: any, next: any;

    beforeEach(() => {
      req = { params: { id: '1' } };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();

      jest.restoreAllMocks();
    });

    it('should return profiles for account', async () => {
      const mockProfiles = [
        { id: 11, name: 'Test Profile 1', account_id: 1 },
        { id: 12, name: 'Test Profile 2', account_id: 1 },
      ];

      (Profile.getAllByAccountId as jest.Mock).mockResolvedValue(mockProfiles);

      await getProfiles(req, res, next);

      expect(Profile.getAllByAccountId).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved profiles for account 1',
        results: [
          { id: 11, name: 'Test Profile 1', image: 'mock-profile-image-url.jpg' },
          { id: 12, name: 'Test Profile 2', image: 'mock-profile-image-url.jpg' },
        ],
      });

      expect(next).not.toHaveBeenCalled();
    });

    it('should handle error when profiles cannot be retrieved', async () => {
      (Profile.getAllByAccountId as jest.Mock).mockResolvedValue(null);

      await getProfiles(req, res, next);

      expect(Profile.getAllByAccountId).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Failed to get all profiles for an account' }),
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle if a database exception occurs', async () => {
      const dbError = new Error('Database error');
      (Profile.getAllByAccountId as jest.Mock).mockRejectedValue(dbError);

      await getProfiles(req, res, next);

      expect(Profile.getAllByAccountId).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(dbError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    let req: any, res: any, next: any;

    beforeEach(() => {
      req = { params: { id: '1', profileId: '12' } };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();

      jest.restoreAllMocks();
    });

    it('should return profile with related content', async () => {
      const mockProfile = {
        id: 12,
        name: 'Profile 12',
      };
      const mockShows = [{ id: 1, title: 'Test Show' }];
      const mockUpcomingEpisodes = [{ id: 1, title: 'Upcoming Episode' }];
      const mockRecentEpisodes = [{ id: 2, title: 'Recent Episode' }];
      const mockNextUnwatchedEpisodes = [{ id: 3, title: 'Next Unwatched' }];
      const mockMovies = [{ id: 1, title: 'Test Movie' }];
      const mockRecentMovies = [{ id: 2, title: 'Recent Movie' }];
      const mockUpcomingMovies = [{ id: 3, title: 'Upcoming Movie' }];

      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);
      (Show.getAllShowsForProfile as jest.Mock).mockResolvedValue(mockShows);
      (Episode.getUpcomingEpisodesForProfile as jest.Mock).mockResolvedValue(mockUpcomingEpisodes);
      (Episode.getRecentEpisodesForProfile as jest.Mock).mockResolvedValue(mockRecentEpisodes);
      (Show.getNextUnwatchedEpisodesForProfile as jest.Mock).mockResolvedValue(mockNextUnwatchedEpisodes);
      (Movie.getAllMoviesForProfile as jest.Mock).mockResolvedValue(mockMovies);
      (Movie.getRecentMovieReleasesForProfile as jest.Mock).mockResolvedValue(mockRecentMovies);
      (Movie.getUpcomingMovieReleasesForProfile as jest.Mock).mockResolvedValue(mockUpcomingMovies);

      await getProfile(req, res, next);

      expect(Profile.findById).toHaveBeenCalledWith(12);
      expect(Show.getAllShowsForProfile).toHaveBeenCalledWith('12');
      expect(Episode.getUpcomingEpisodesForProfile).toHaveBeenCalledWith('12');
      expect(Episode.getRecentEpisodesForProfile).toHaveBeenCalledWith('12');
      expect(Show.getNextUnwatchedEpisodesForProfile).toHaveBeenCalledWith('12');
      expect(Movie.getAllMoviesForProfile).toHaveBeenCalledWith('12');
      expect(Movie.getRecentMovieReleasesForProfile).toHaveBeenCalledWith('12');
      expect(Movie.getUpcomingMovieReleasesForProfile).toHaveBeenCalledWith('12');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved profile with id: 12',
        results: {
          profile: { id: 12, name: 'Profile 12', image: 'mock-profile-image-url.jpg' },
          shows: mockShows,
          recentEpisodes: mockRecentEpisodes,
          upcomingEpisodes: mockUpcomingEpisodes,
          nextUnwatchedEpisodes: mockNextUnwatchedEpisodes,
          movies: mockMovies,
          recentMovies: mockRecentMovies,
          upcomingMovies: mockUpcomingMovies,
        },
      });
    });

    it('should handle profile not found', async () => {
      req.params = { id: '1', profileId: '999' };
      (Profile.findById as jest.Mock).mockResolvedValue(null);

      await getProfile(req, res, next);

      expect(Profile.findById).toHaveBeenCalledWith(999);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Profile not found' }));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle if a database error occurs', async () => {
      req.params = { id: '1', profileId: '998' };
      const dbError = new Error('Database error');
      (Profile.findById as jest.Mock).mockRejectedValue(dbError);

      await getProfile(req, res, next);

      expect(Profile.findById).toHaveBeenCalledWith(998);
      expect(next).toHaveBeenCalledWith(dbError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
