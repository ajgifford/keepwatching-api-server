import Movie from '@models/movie';
import { CacheService } from '@services/cacheService';
import { errorService } from '@services/errorService';
import { moviesService } from '@services/moviesService';
import { getTMDBService } from '@services/tmdbService';
import { getUSMPARating } from '@utils/contentUtility';
import { getUSWatchProviders } from '@utils/watchProvidersUtility';

jest.mock('@models/movie');
jest.mock('@services/cacheService');
jest.mock('@services/errorService');
jest.mock('@services/tmdbService');
jest.mock('@utils/contentUtility');
jest.mock('@utils/watchProvidersUtility');

describe('MoviesService', () => {
  let mockCacheService: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock cache moviesService
    mockCacheService = {
      getOrSet: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
      invalidatePattern: jest.fn(),
      flushAll: jest.fn(),
      getStats: jest.fn(),
      keys: jest.fn(),
    };

    // Mock the static getInstance method to return our mock CacheService
    jest.spyOn(CacheService, 'getInstance').mockReturnValue(mockCacheService);

    // Reset the moviesService to use our mock CacheService
    Object.defineProperty(moviesService, 'cache', {
      value: mockCacheService,
      writable: true,
    });
  });

  describe('getMoviesForProfile', () => {
    it('should return movies from cache when available', async () => {
      const mockMovies = [{ movie_id: 1, title: 'Test Movie' }];
      mockCacheService.getOrSet.mockResolvedValue(mockMovies);

      const result = await moviesService.getMoviesForProfile('123');

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith('profile_123_movies', expect.any(Function), 600);
      expect(result).toEqual(mockMovies);
    });

    it('should fetch movies from database when not in cache', async () => {
      const mockMovies = [{ movie_id: 1, title: 'Test Movie' }];
      mockCacheService.getOrSet.mockImplementation(async (key: any, fn: () => any) => fn());
      (Movie.getAllMoviesForProfile as jest.Mock).mockResolvedValue(mockMovies);

      const result = await moviesService.getMoviesForProfile('123');

      expect(mockCacheService.getOrSet).toHaveBeenCalled();
      expect(Movie.getAllMoviesForProfile).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockMovies);
    });

    it('should handle errors properly', async () => {
      const error = new Error('Database error');
      mockCacheService.getOrSet.mockImplementation(async (key: any, fn: () => any) => fn());
      (Movie.getAllMoviesForProfile as jest.Mock).mockRejectedValue(error);
      (errorService.handleError as jest.Mock).mockImplementation((err) => {
        throw err;
      });

      await expect(moviesService.getMoviesForProfile('123')).rejects.toThrow('Database error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'getMoviesForProfile(123)');
    });
  });

  describe('getRecentUpcomingMoviesForProfile', () => {
    it('should fetch and combine recent and upcoming movies', async () => {
      const mockRecentMovies = [{ movie_id: 1, title: 'Recent Movie' }];
      const mockUpcomingMovies = [{ movie_id: 2, title: 'Upcoming Movie' }];

      mockCacheService.getOrSet.mockImplementation(async (key: any, fn: () => any) => fn());
      (Movie.getRecentMovieReleasesForProfile as jest.Mock).mockResolvedValue(mockRecentMovies);
      (Movie.getUpcomingMovieReleasesForProfile as jest.Mock).mockResolvedValue(mockUpcomingMovies);

      const result = await moviesService.getRecentUpcomingMoviesForProfile('123');

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        'profile_123_recent_upcoming_movies',
        expect.any(Function),
        300,
      );
      expect(Movie.getRecentMovieReleasesForProfile).toHaveBeenCalledWith('123');
      expect(Movie.getUpcomingMovieReleasesForProfile).toHaveBeenCalledWith('123');
      expect(result).toEqual({ recentMovies: mockRecentMovies, upcomingMovies: mockUpcomingMovies });
    });

    it('should handle errors properly', async () => {
      const error = new Error('Database error');
      mockCacheService.getOrSet.mockImplementation(async (key: any, fn: () => any) => fn());
      (Movie.getRecentMovieReleasesForProfile as jest.Mock).mockRejectedValue(error);
      (errorService.handleError as jest.Mock).mockImplementation((err) => {
        throw err;
      });

      await expect(moviesService.getRecentUpcomingMoviesForProfile('123')).rejects.toThrow('Database error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'getRecentUpcomingMoviesForProfile(123)');
    });
  });

  describe('addMovieToFavorites', () => {
    it('should add existing movie to favorites', async () => {
      const mockMovie = {
        id: 5,
        tmdb_id: 12345,
        title: 'Existing Movie',
        saveFavorite: jest.fn().mockResolvedValue(undefined),
      };
      const mockMovieForProfile = { movie_id: 5, title: 'Existing Movie' };
      const mockRecentUpcoming = {
        recentMovies: [{ movie_id: 1 }],
        upcomingMovies: [{ movie_id: 2 }],
      };

      (Movie.findByTMDBId as jest.Mock).mockResolvedValue(mockMovie);
      (Movie.getMovieForProfile as jest.Mock).mockResolvedValue(mockMovieForProfile);
      mockCacheService.getOrSet.mockResolvedValue(mockRecentUpcoming);

      const result = await moviesService.addMovieToFavorites('123', 12345);

      expect(Movie.findByTMDBId).toHaveBeenCalledWith(12345);
      expect(mockMovie.saveFavorite).toHaveBeenCalledWith('123');
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith('profile_123_movie');
      expect(result).toEqual({
        favoritedMovie: mockMovieForProfile,
        recentMovies: mockRecentUpcoming.recentMovies,
        upcomingMovies: mockRecentUpcoming.upcomingMovies,
      });
    });

    it('should fetch and add new movie from TMDB', async () => {
      const mockTMDBResponse = {
        id: 12345,
        title: 'New Movie',
        overview: 'Description',
        release_date: '2023-01-01',
        runtime: 120,
        poster_path: '/poster.jpg',
        backdrop_path: '/backdrop.jpg',
        vote_average: 8.5,
        release_dates: { results: [] },
        genres: [{ id: 28 }, { id: 12 }],
      };

      const mockMovieInstance = {
        id: 5,
        save: jest.fn().mockResolvedValue(true),
        saveFavorite: jest.fn().mockResolvedValue(undefined),
      };

      const mockMovieForProfile = { movie_id: 5, title: 'New Movie' };
      const mockRecentUpcoming = {
        recentMovies: [{ movie_id: 1 }],
        upcomingMovies: [{ movie_id: 2 }],
      };

      const mockTMDBService = { getMovieDetails: jest.fn().mockResolvedValue(mockTMDBResponse) };
      (getTMDBService as jest.Mock).mockReturnValue(mockTMDBService);
      (Movie.findByTMDBId as jest.Mock).mockResolvedValue(null);
      (Movie as unknown as jest.Mock).mockImplementation(() => mockMovieInstance);
      (Movie.getMovieForProfile as jest.Mock).mockResolvedValue(mockMovieForProfile);
      (getUSMPARating as jest.Mock).mockReturnValue('PG-13');
      (getUSWatchProviders as jest.Mock).mockReturnValue([8, 9]);
      mockCacheService.getOrSet.mockResolvedValue(mockRecentUpcoming);

      const result = await moviesService.addMovieToFavorites('123', 12345);

      expect(Movie.findByTMDBId).toHaveBeenCalledWith(12345);
      expect(getTMDBService).toHaveBeenCalled();
      expect(mockTMDBService.getMovieDetails).toHaveBeenCalledWith(12345);
      expect(Movie).toHaveBeenCalledWith(
        12345,
        'New Movie',
        'Description',
        '2023-01-01',
        120,
        '/poster.jpg',
        '/backdrop.jpg',
        8.5,
        'PG-13',
        undefined,
        [8, 9],
        [28, 12],
      );
      expect(mockMovieInstance.save).toHaveBeenCalled();
      expect(mockMovieInstance.saveFavorite).toHaveBeenCalledWith('123');
      expect(result).toEqual({
        favoritedMovie: mockMovieForProfile,
        recentMovies: mockRecentUpcoming.recentMovies,
        upcomingMovies: mockRecentUpcoming.upcomingMovies,
      });
    });

    it('should throw error when movie save fails', async () => {
      const mockTMDBResponse = {
        id: 12345,
        title: 'New Movie',
        overview: 'Description',
        release_date: '2023-01-01',
        runtime: 120,
        poster_path: '/poster.jpg',
        backdrop_path: '/backdrop.jpg',
        vote_average: 8.5,
        release_dates: { results: [] },
        genres: [{ id: 28 }, { id: 12 }],
      };

      const mockMovieInstance = {
        save: jest.fn().mockResolvedValue(false),
      };

      const mockTMDBService = { getMovieDetails: jest.fn().mockResolvedValue(mockTMDBResponse) };
      (getTMDBService as jest.Mock).mockReturnValue(mockTMDBService);
      (Movie.findByTMDBId as jest.Mock).mockResolvedValue(null);
      (Movie as unknown as jest.Mock).mockImplementation(() => mockMovieInstance);
      (getUSMPARating as jest.Mock).mockReturnValue('PG-13');
      (getUSWatchProviders as jest.Mock).mockReturnValue([8, 9]);
      (errorService.handleError as jest.Mock).mockImplementation((err) => {
        throw err;
      });

      await expect(moviesService.addMovieToFavorites('123', 12345)).rejects.toThrow('Failed to save movie information');
      expect(mockMovieInstance.save).toHaveBeenCalled();
    });

    it('should handle TMDB API errors', async () => {
      const error = new Error('TMDB API error');
      const mockTMDBService = { getMovieDetails: jest.fn().mockRejectedValue(error) };
      (getTMDBService as jest.Mock).mockReturnValue(mockTMDBService);
      (Movie.findByTMDBId as jest.Mock).mockResolvedValue(null);
      (errorService.handleError as jest.Mock).mockImplementation((err) => {
        throw err;
      });

      await expect(moviesService.addMovieToFavorites('123', 12345)).rejects.toThrow('TMDB API error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'addMovieToFavorites(123, 12345)');
    });
  });

  describe('removeMovieFromFavorites', () => {
    it('should remove a movie from favorites', async () => {
      const mockMovie = {
        id: 5,
        title: 'Movie to Remove',
        removeFavorite: jest.fn().mockResolvedValue(undefined),
      };
      const mockRecentUpcoming = {
        recentMovies: [{ movie_id: 1 }],
        upcomingMovies: [{ movie_id: 2 }],
      };

      (Movie.findById as jest.Mock).mockResolvedValue(mockMovie);
      mockCacheService.getOrSet.mockResolvedValue(mockRecentUpcoming);

      const result = await moviesService.removeMovieFromFavorites('123', 5);

      expect(Movie.findById).toHaveBeenCalledWith(5);
      expect(mockMovie.removeFavorite).toHaveBeenCalledWith('123');
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith('profile_123_movie');
      expect(result).toEqual({
        removedMovie: mockMovie,
        recentMovies: mockRecentUpcoming.recentMovies,
        upcomingMovies: mockRecentUpcoming.upcomingMovies,
      });
    });

    it('should throw NotFoundError when movie does not exist', async () => {
      (Movie.findById as jest.Mock).mockResolvedValue(null);
      (errorService.handleError as jest.Mock).mockImplementation((err) => {
        throw err;
      });

      await expect(moviesService.removeMovieFromFavorites('123', 999)).rejects.toThrow('Movie with ID 999 not found');
      expect(Movie.findById).toHaveBeenCalledWith(999);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      (Movie.findById as jest.Mock).mockRejectedValue(error);
      (errorService.handleError as jest.Mock).mockImplementation((err) => {
        throw err;
      });

      await expect(moviesService.removeMovieFromFavorites('123', 5)).rejects.toThrow('Database error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'removeMovieFromFavorites(123, 5)');
    });
  });

  describe('updateMovieWatchStatus', () => {
    it('should update movie watch status successfully', async () => {
      (Movie.updateWatchStatus as jest.Mock).mockResolvedValue(true);

      const result = await moviesService.updateMovieWatchStatus('123', 5, 'WATCHED');

      expect(Movie.updateWatchStatus).toHaveBeenCalledWith('123', 5, 'WATCHED');
      expect(mockCacheService.invalidate).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });

    it('should throw BadRequestError when update fails', async () => {
      (Movie.updateWatchStatus as jest.Mock).mockResolvedValue(false);
      (errorService.handleError as jest.Mock).mockImplementation((err) => {
        throw err;
      });

      await expect(moviesService.updateMovieWatchStatus('123', 5, 'WATCHED')).rejects.toThrow(
        'Failed to update watch status. Ensure the movie (ID: 5) exists in your favorites.',
      );
      expect(Movie.updateWatchStatus).toHaveBeenCalledWith('123', 5, 'WATCHED');
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      (Movie.updateWatchStatus as jest.Mock).mockRejectedValue(error);
      (errorService.handleError as jest.Mock).mockImplementation((err) => {
        throw err;
      });

      await expect(moviesService.updateMovieWatchStatus('123', 5, 'WATCHED')).rejects.toThrow('Database error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'updateMovieWatchStatus(123, 5, WATCHED)');
    });
  });

  describe('getProfileMovieStatistics', () => {
    it('should return movie statistics from cache when available', async () => {
      const mockStats = {
        total: 2,
        watchStatusCounts: { watched: 1, notWatched: 1 },
        genreDistribution: { Action: 1, Comedy: 1 },
        serviceDistribution: { Netflix: 1, Prime: 1 },
        watchProgress: 50,
      };

      mockCacheService.getOrSet.mockResolvedValue(mockStats);

      const result = await moviesService.getProfileMovieStatistics('123');

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith('profile_123_movie_stats', expect.any(Function), 1800);
      expect(result).toEqual(mockStats);
    });

    it('should calculate statistics from movies when not in cache', async () => {
      const mockMovies = [
        {
          watch_status: 'WATCHED',
          genres: 'Action, Adventure',
          streaming_services: 'Netflix, Disney+',
        },
        {
          watch_status: 'NOT_WATCHED',
          genres: 'Comedy',
          streaming_services: 'Prime',
        },
      ];

      mockCacheService.getOrSet.mockImplementation(async (key: any, fn: () => any) => fn());
      (Movie.getAllMoviesForProfile as jest.Mock).mockResolvedValue(mockMovies);

      const result = await moviesService.getProfileMovieStatistics('123');

      expect(mockCacheService.getOrSet).toHaveBeenCalled();
      expect(Movie.getAllMoviesForProfile).toHaveBeenCalledWith('123');
      expect(result).toEqual({
        total: 2,
        watchStatusCounts: { watched: 1, notWatched: 1 },
        genreDistribution: { Action: 1, Adventure: 1, Comedy: 1 },
        serviceDistribution: { Netflix: 1, 'Disney+': 1, Prime: 1 },
        watchProgress: 50,
      });
    });

    it('should handle empty movie list', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key: any, fn: () => any) => fn());
      (Movie.getAllMoviesForProfile as jest.Mock).mockResolvedValue([]);

      const result = await moviesService.getProfileMovieStatistics('123');

      expect(result).toEqual({
        total: 0,
        watchStatusCounts: { watched: 0, notWatched: 0 },
        genreDistribution: {},
        serviceDistribution: {},
        watchProgress: 0,
      });
    });

    it('should handle errors properly', async () => {
      const error = new Error('Database error');
      mockCacheService.getOrSet.mockImplementation(async (key: any, fn: () => any) => fn());
      (Movie.getAllMoviesForProfile as jest.Mock).mockRejectedValue(error);
      (errorService.handleError as jest.Mock).mockImplementation((err) => {
        throw err;
      });

      await expect(moviesService.getProfileMovieStatistics('123')).rejects.toThrow('Database error');
      expect(errorService.handleError).toHaveBeenCalledWith(error, 'getProfileMovieStatistics(123)');
    });
  });
});
