import { CustomError } from '@middleware/errorMiddleware';
import Account from '@models/account';
import Movie from '@models/movie';
import Profile from '@models/profile';
import Show from '@models/show';
import { accountService, AccountService } from '@services/accountService';
import { CacheService } from '@services/cacheService';
import { episodesService } from '@services/episodesService';
import { errorService } from '@services/errorService';
import { moviesService } from '@services/moviesService';
import { showService } from '@services/showService';
import { statisticsService } from '@services/statisticsService';
import { getAccountImage, getProfileImage } from '@utils/imageUtility';

jest.mock('@models/account');
jest.mock('@models/profile');
jest.mock('@models/show');
jest.mock('@models/movie');
jest.mock('@services/cacheService');
jest.mock('@services/errorService');
jest.mock('@services/episodesService');
jest.mock('@services/moviesService');
jest.mock('@services/showService');
jest.mock('@services/statisticsService');
jest.mock('@utils/imageUtility');

describe('AccountService', () => {
  let service: AccountService;
  let mockCache: jest.Mocked<CacheService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a new instance for each test to avoid shared state
    mockCache = {
      getOrSet: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
      invalidatePattern: jest.fn(),
      flushAll: jest.fn(),
      getStats: jest.fn(),
      keys: jest.fn(),
    } as any;

    // Use prototype to swap the cache dependency
    Object.setPrototypeOf(accountService, AccountService.prototype);
    (accountService as any).cache = mockCache;

    service = accountService;

    // Mock image utility functions
    (getProfileImage as jest.Mock).mockReturnValue('profile-image-url.jpg');
    (getAccountImage as jest.Mock).mockReturnValue('account-image-url.jpg');

    // Mock errorService
    (errorService.handleError as jest.Mock).mockImplementation((error) => {
      throw error;
    });
  });

  describe('getProfiles', () => {
    it('should return profiles from cache when available', async () => {
      const mockProfiles = [
        { id: 1, name: 'Profile 1', image: 'profile1.jpg' },
        { id: 2, name: 'Profile 2', image: 'profile2.jpg' },
      ];
      mockCache.getOrSet.mockResolvedValue(mockProfiles);

      const result = await service.getProfiles(123);

      expect(mockCache.getOrSet).toHaveBeenCalledWith('account_123_profiles', expect.any(Function), 600);
      expect(result).toEqual(mockProfiles);
    });

    it('should fetch profiles from database when not in cache', async () => {
      const mockDBProfiles = [
        { id: 1, name: 'Profile 1', account_id: 123 },
        { id: 2, name: 'Profile 2', account_id: 123 },
      ];
      const expectedProfiles = [
        { id: 1, name: 'Profile 1', image: 'profile-image-url.jpg' },
        { id: 2, name: 'Profile 2', image: 'profile-image-url.jpg' },
      ];

      mockCache.getOrSet.mockImplementation(async (key, fn) => fn());
      (Profile.getAllByAccountId as jest.Mock).mockResolvedValue(mockDBProfiles);

      const result = await service.getProfiles(123);

      expect(mockCache.getOrSet).toHaveBeenCalled();
      expect(Profile.getAllByAccountId).toHaveBeenCalledWith(123);
      expect(result).toEqual(expectedProfiles);
    });

    it('should throw BadRequestError when profiles cannot be retrieved', async () => {
      mockCache.getOrSet.mockImplementation(async (key, fn) => fn());
      (Profile.getAllByAccountId as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfiles(123)).rejects.toThrow(CustomError);
      expect(Profile.getAllByAccountId).toHaveBeenCalledWith(123);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockCache.getOrSet.mockImplementation(async (key, fn) => fn());
      (Profile.getAllByAccountId as jest.Mock).mockRejectedValue(error);

      await expect(service.getProfiles(123)).rejects.toThrow('Database error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'getProfiles(123)');
    });
  });

  describe('getProfile', () => {
    const mockProfile = { id: 123, name: 'Test Profile', account_id: 1 };
    const mockShows = [{ show_id: 1, title: 'Test Show' }];
    const mockMovies = [{ movie_id: 1, title: 'Test Movie' }];
    const mockRecentEpisodes = [{ id: 1, title: 'Recent Episode' }];
    const mockUpcomingEpisodes = [{ id: 2, title: 'Upcoming Episode' }];
    const mockNextUnwatchedEpisodes = [{ show_id: 1, episodes: [{ id: 3 }] }];
    const mockRecentMovies = [{ movie_id: 2, title: 'Recent Movie' }];
    const mockUpcomingMovies = [{ movie_id: 3, title: 'Upcoming Movie' }];

    it('should return profile data from cache when available', async () => {
      const mockProfileData = {
        profile: { id: 123, name: 'Test Profile', image: 'profile.jpg' },
        shows: mockShows,
        movies: mockMovies,
        recentEpisodes: mockRecentEpisodes,
        upcomingEpisodes: mockUpcomingEpisodes,
        nextUnwatchedEpisodes: mockNextUnwatchedEpisodes,
        recentMovies: mockRecentMovies,
        upcomingMovies: mockUpcomingMovies,
      };

      mockCache.getOrSet.mockResolvedValue(mockProfileData);

      const result = await service.getProfile(123);

      expect(mockCache.getOrSet).toHaveBeenCalledWith('profile_123_complete', expect.any(Function), 600);
      expect(result).toEqual(mockProfileData);
    });

    it('should fetch and combine profile data when not in cache', async () => {
      mockCache.getOrSet.mockImplementation(async (key, fn) => fn());

      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);
      (showService.getShowsForProfile as jest.Mock).mockResolvedValue(mockShows);
      (moviesService.getMoviesForProfile as jest.Mock).mockResolvedValue(mockMovies);
      (episodesService.getRecentEpisodesForProfile as jest.Mock).mockResolvedValue(mockRecentEpisodes);
      (episodesService.getUpcomingEpisodesForProfile as jest.Mock).mockResolvedValue(mockUpcomingEpisodes);
      (Show.getNextUnwatchedEpisodesForProfile as jest.Mock).mockResolvedValue(mockNextUnwatchedEpisodes);
      (Movie.getRecentMovieReleasesForProfile as jest.Mock).mockResolvedValue(mockRecentMovies);
      (Movie.getUpcomingMovieReleasesForProfile as jest.Mock).mockResolvedValue(mockUpcomingMovies);

      const result = await service.getProfile(123);

      expect(mockCache.getOrSet).toHaveBeenCalled();
      expect(Profile.findById).toHaveBeenCalledWith(123);
      expect(showService.getShowsForProfile).toHaveBeenCalledWith('123');
      expect(moviesService.getMoviesForProfile).toHaveBeenCalledWith('123');
      expect(episodesService.getRecentEpisodesForProfile).toHaveBeenCalledWith('123');
      expect(episodesService.getUpcomingEpisodesForProfile).toHaveBeenCalledWith('123');
      expect(Show.getNextUnwatchedEpisodesForProfile).toHaveBeenCalledWith('123');

      expect(result).toEqual({
        profile: { id: 123, name: 'Test Profile', image: 'profile-image-url.jpg' },
        shows: mockShows,
        movies: mockMovies,
        recentEpisodes: mockRecentEpisodes,
        upcomingEpisodes: mockUpcomingEpisodes,
        nextUnwatchedEpisodes: mockNextUnwatchedEpisodes,
        recentMovies: mockRecentMovies,
        upcomingMovies: mockUpcomingMovies,
      });
    });

    it('should throw NotFoundError when profile does not exist', async () => {
      mockCache.getOrSet.mockImplementation(async (key, fn) => fn());
      (Profile.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(CustomError);
      expect(Profile.findById).toHaveBeenCalledWith(999);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockCache.getOrSet.mockImplementation(async (key, fn) => fn());
      (Profile.findById as jest.Mock).mockRejectedValue(error);

      await expect(service.getProfile(123)).rejects.toThrow('Database error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'getProfile(123)');
    });
  });

  describe('editAccount', () => {
    const mockAccount = {
      account_id: 123,
      account_name: 'Original Account',
      email: 'test@example.com',
      uid: 'uid123',
      default_profile_id: 1,
      editAccount: jest.fn(),
    };

    const mockUpdatedAccount = {
      account_id: 123,
      account_name: 'Updated Account',
      email: 'test@example.com',
      uid: 'uid123',
      default_profile_id: 2,
    };

    it('should update an account successfully', async () => {
      (Account.findById as jest.Mock).mockResolvedValue(mockAccount);
      mockAccount.editAccount.mockResolvedValue(mockUpdatedAccount);

      const result = await service.editAccount(123, 'Updated Account', 2);

      expect(Account.findById).toHaveBeenCalledWith(123);
      expect(mockAccount.editAccount).toHaveBeenCalledWith('Updated Account', 2);
      expect(mockCache.invalidatePattern).toHaveBeenCalledWith('account_123');
      expect(result).toEqual({
        id: 123,
        name: 'Updated Account',
        email: 'test@example.com',
        image: 'account-image-url.jpg',
        default_profile_id: 2,
      });
    });

    it('should throw NotFoundError when account does not exist', async () => {
      (Account.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.editAccount(999, 'Test', 1)).rejects.toThrow(CustomError);
      expect(Account.findById).toHaveBeenCalledWith(999);
    });

    it('should throw BadRequestError when update fails', async () => {
      (Account.findById as jest.Mock).mockResolvedValue(mockAccount);
      mockAccount.editAccount.mockResolvedValue(null);

      await expect(service.editAccount(123, 'Updated Account', 2)).rejects.toThrow(CustomError);
      expect(Account.findById).toHaveBeenCalledWith(123);
      expect(mockAccount.editAccount).toHaveBeenCalledWith('Updated Account', 2);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      (Account.findById as jest.Mock).mockResolvedValue(mockAccount);
      mockAccount.editAccount.mockRejectedValue(error);

      await expect(service.editAccount(123, 'Updated Account', 2)).rejects.toThrow('Database error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'editAccount(123)');
    });
  });

  describe('addProfile', () => {
    it('should add a profile successfully', async () => {
      const mockProfile = {
        account_id: 123,
        name: 'New Profile',
        id: undefined,
        save: jest.fn().mockImplementation(function (this: any) {
          this.id = 456;
          return Promise.resolve();
        }),
      };

      (Profile as jest.MockedClass<typeof Profile>).mockImplementation(() => mockProfile as any);

      const result = await service.addProfile(123, 'New Profile');

      expect(Profile).toHaveBeenCalledWith(123, 'New Profile');
      expect(mockProfile.save).toHaveBeenCalled();
      expect(mockCache.invalidate).toHaveBeenCalledWith('account_123_profiles');
      expect(statisticsService.invalidateAccountStatistics).toHaveBeenCalledWith(123);
      expect(result).toEqual({
        id: 456,
        name: 'New Profile',
        image: 'profile-image-url.jpg',
      });
    });

    it('should throw BadRequestError when profile creation fails', async () => {
      const mockProfile = {
        account_id: 123,
        name: 'New Profile',
        id: undefined,
        save: jest.fn().mockResolvedValue(undefined),
      };

      (Profile as jest.MockedClass<typeof Profile>).mockImplementation(() => mockProfile as any);

      await expect(service.addProfile(123, 'New Profile')).rejects.toThrow(CustomError);
      expect(Profile).toHaveBeenCalledWith(123, 'New Profile');
      expect(mockProfile.save).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      const mockProfile = {
        account_id: 123,
        name: 'New Profile',
        save: jest.fn().mockRejectedValue(error),
      };

      (Profile as jest.MockedClass<typeof Profile>).mockImplementation(() => mockProfile as any);

      await expect(service.addProfile(123, 'New Profile')).rejects.toThrow('Database error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'addProfile(123, New Profile)');
    });
  });

  describe('editProfile', () => {
    const mockProfile = {
      id: 123,
      name: 'Original Profile',
      account_id: 1,
      update: jest.fn(),
    };

    const mockUpdatedProfile = {
      id: 123,
      name: 'Updated Profile',
      account_id: 1,
    };

    it('should update a profile successfully', async () => {
      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);
      mockProfile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await service.editProfile(123, 'Updated Profile');

      expect(Profile.findById).toHaveBeenCalledWith(123);
      expect(mockProfile.update).toHaveBeenCalledWith('Updated Profile');
      expect(mockCache.invalidatePattern).toHaveBeenCalledWith('profile_123');
      expect(statisticsService.invalidateProfileStatistics).toHaveBeenCalledWith('123');
      expect(result).toEqual({
        id: 123,
        name: 'Updated Profile',
        image: 'profile-image-url.jpg',
      });
    });

    it('should throw NotFoundError when profile does not exist', async () => {
      (Profile.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.editProfile(999, 'Test')).rejects.toThrow(CustomError);
      expect(Profile.findById).toHaveBeenCalledWith(999);
    });

    it('should throw BadRequestError when update fails', async () => {
      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);
      mockProfile.update.mockResolvedValue(null);

      await expect(service.editProfile(123, 'Updated Profile')).rejects.toThrow(CustomError);
      expect(Profile.findById).toHaveBeenCalledWith(123);
      expect(mockProfile.update).toHaveBeenCalledWith('Updated Profile');
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);
      mockProfile.update.mockRejectedValue(error);

      await expect(service.editProfile(123, 'Updated Profile')).rejects.toThrow('Database error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'editProfile(123)');
    });
  });

  describe('deleteProfile', () => {
    const mockProfile = {
      id: 123,
      name: 'Profile to Delete',
      account_id: 1,
      delete: jest.fn(),
    };

    it('should delete a profile successfully', async () => {
      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);
      mockProfile.delete.mockResolvedValue(true);

      const result = await service.deleteProfile(123, 1);

      expect(Profile.findById).toHaveBeenCalledWith(123);
      expect(mockProfile.delete).toHaveBeenCalled();
      expect(mockCache.invalidatePattern).toHaveBeenCalledWith('profile_123');
      expect(mockCache.invalidate).toHaveBeenCalledWith('account_1_profiles');
      expect(statisticsService.invalidateAccountStatistics).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw NotFoundError when profile does not exist', async () => {
      (Profile.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteProfile(999, 1)).rejects.toThrow(CustomError);
      expect(Profile.findById).toHaveBeenCalledWith(999);
    });

    it('should throw BadRequestError when deletion fails', async () => {
      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);
      mockProfile.delete.mockResolvedValue(false);

      await expect(service.deleteProfile(123, 1)).rejects.toThrow(CustomError);
      expect(Profile.findById).toHaveBeenCalledWith(123);
      expect(mockProfile.delete).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      (Profile.findById as jest.Mock).mockResolvedValue(mockProfile);
      mockProfile.delete.mockRejectedValue(error);

      await expect(service.deleteProfile(123, 1)).rejects.toThrow('Database error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'deleteProfile(123)');
    });
  });
});
