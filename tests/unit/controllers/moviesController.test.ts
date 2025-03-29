import {
  addFavorite,
  getMovies,
  getRecentUpcomingForProfile,
  removeFavorite,
  updateMovieWatchStatus,
} from '@controllers/moviesController';
import { moviesService } from '@services/moviesService';

jest.mock('@services/moviesService');

describe('moviesController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

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

  describe('getMovies', () => {
    it('should get movies for a profile', async () => {
      const mockMovies = [
        { movie_id: 1, title: 'Movie 1', watch_status: 'WATCHED' },
        { movie_id: 2, title: 'Movie 2', watch_status: 'NOT_WATCHED' },
      ];
      (moviesService.getMoviesForProfile as jest.Mock).mockResolvedValue(mockMovies);

      await getMovies(req, res, next);

      expect(moviesService.getMoviesForProfile).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved movies for a profile',
        results: mockMovies,
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to get movies');
      (moviesService.getMoviesForProfile as jest.Mock).mockRejectedValue(error);

      await getMovies(req, res, next);

      expect(moviesService.getMoviesForProfile).toHaveBeenCalledWith('123');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('addFavorite', () => {
    it('should add a movie to favorites', async () => {
      req.body = { movieId: 12345 };
      const mockResult = {
        favoritedMovie: { movie_id: 12345, title: 'New Movie' },
        recentMovies: [{ movie_id: 1 }],
        upcomingMovies: [{ movie_id: 2 }],
      };
      (moviesService.addMovieToFavorites as jest.Mock).mockResolvedValue(mockResult);

      await addFavorite(req, res, next);

      expect(moviesService.addMovieToFavorites).toHaveBeenCalledWith('123', 12345);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully saved movie as a favorite',
        result: mockResult,
      });
    });

    it('should handle errors', async () => {
      req.body = { movieId: 12345 };
      const error = new Error('Failed to add movie');
      (moviesService.addMovieToFavorites as jest.Mock).mockRejectedValue(error);

      await addFavorite(req, res, next);

      expect(moviesService.addMovieToFavorites).toHaveBeenCalledWith('123', 12345);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('removeFavorite', () => {
    it('should remove a movie from favorites', async () => {
      req.params.movieId = '12345';
      const mockResult = {
        removedMovie: { id: 12345, title: 'Movie to Remove' },
        recentMovies: [{ movie_id: 1 }],
        upcomingMovies: [{ movie_id: 2 }],
      };
      (moviesService.removeMovieFromFavorites as jest.Mock).mockResolvedValue(mockResult);

      await removeFavorite(req, res, next);

      expect(moviesService.removeMovieFromFavorites).toHaveBeenCalledWith('123', 12345);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully removed the movie from favorites',
        result: mockResult,
      });
    });

    it('should handle errors', async () => {
      req.params.movieId = '12345';
      const error = new Error('Failed to remove movie');
      (moviesService.removeMovieFromFavorites as jest.Mock).mockRejectedValue(error);

      await removeFavorite(req, res, next);

      expect(moviesService.removeMovieFromFavorites).toHaveBeenCalledWith('123', 12345);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('updateMovieWatchStatus', () => {
    it('should update movie watch status', async () => {
      req.body = { movieId: 12345, status: 'WATCHED' };
      (moviesService.updateMovieWatchStatus as jest.Mock).mockResolvedValue(true);

      await updateMovieWatchStatus(req, res, next);

      expect(moviesService.updateMovieWatchStatus).toHaveBeenCalledWith('123', 12345, 'WATCHED');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Successfully updated the watch status to 'WATCHED'",
      });
    });

    it('should handle errors', async () => {
      req.body = { movieId: 12345, status: 'WATCHED' };
      const error = new Error('Failed to update watch status');
      (moviesService.updateMovieWatchStatus as jest.Mock).mockRejectedValue(error);

      await updateMovieWatchStatus(req, res, next);

      expect(moviesService.updateMovieWatchStatus).toHaveBeenCalledWith('123', 12345, 'WATCHED');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getRecentUpcomingForProfile', () => {
    it('should get recent and upcoming movies', async () => {
      const mockData = {
        recentMovies: [{ movie_id: 1, title: 'Recent Movie' }],
        upcomingMovies: [{ movie_id: 2, title: 'Upcoming Movie' }],
      };
      (moviesService.getRecentUpcomingMoviesForProfile as jest.Mock).mockResolvedValue(mockData);

      await getRecentUpcomingForProfile(req, res, next);

      expect(moviesService.getRecentUpcomingMoviesForProfile).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved recent & upcoming movies for a profile',
        results: mockData,
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to get recent and upcoming movies');
      (moviesService.getRecentUpcomingMoviesForProfile as jest.Mock).mockRejectedValue(error);

      await getRecentUpcomingForProfile(req, res, next);

      expect(moviesService.getRecentUpcomingMoviesForProfile).toHaveBeenCalledWith('123');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
