import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware';
import Movie from '../models/movie';
import { getUSMPARating } from '../utils/contentUtility';
import { getUSWatchProviders } from '../utils/watchProvidersUtility';
import { CacheService } from './cacheService';
import { errorService } from './errorService';
import { getTMDBService } from './tmdbService';

// Cache invalidation constants
const CACHE_KEYS = {
  PROFILE_MOVIES: (profileId: string) => `profile_${profileId}_movies`,
  PROFILE_MOVIE: (profileId: string, movieId: number) => `profile_${profileId}_movie_${movieId}`,
  PROFILE_RECENT_MOVIES: (profileId: string) => `profile_${profileId}_recent_movies`,
  PROFILE_UPCOMING_MOVIES: (profileId: string) => `profile_${profileId}_upcoming_movies`,
};

/**
 * Service class for handling movie-related business logic
 * This separates the business logic from the controller layer
 */
export class MoviesService {
  private cache: CacheService;

  constructor() {
    this.cache = CacheService.getInstance();
  }

  /**
   * Invalidate all caches related to a profile's movies
   */
  public invalidateProfileMovieCache(profileId: string): void {
    this.cache.invalidatePattern(`profile_${profileId}_movie`);
  }

  /**
   * Retrieves all movies for a specific profile
   *
   * @param profileId - ID of the profile to get movies for
   * @returns Movies associated with the profile
   */
  public async getMoviesForProfile(profileId: string) {
    try {
      return await this.cache.getOrSet(
        CACHE_KEYS.PROFILE_MOVIES(profileId),
        () => Movie.getAllMoviesForProfile(profileId),
        600, // 10 minutes TTL
      );
    } catch (error) {
      throw errorService.handleError(error, `getMoviesForProfile(${profileId})`);
    }
  }

  /**
   * Gets recent and upcoming movies for a profile
   *
   * @param profileId - ID of the profile to get movies for
   * @returns Object containing recent and upcoming movies arrays
   */
  public async getRecentUpcomingMoviesForProfile(profileId: string) {
    try {
      return await this.cache.getOrSet(
        `profile_${profileId}_recent_upcoming_movies`,
        async () => {
          const [recentMovies, upcomingMovies] = await Promise.all([
            Movie.getRecentMovieReleasesForProfile(profileId),
            Movie.getUpcomingMovieReleasesForProfile(profileId),
          ]);

          return { recentMovies, upcomingMovies };
        },
        300, // 5 minutes TTL
      );
    } catch (error) {
      throw errorService.handleError(error, `getRecentUpcomingMoviesForProfile(${profileId})`);
    }
  }

  /**
   * Adds a movie to a profile's favorites
   *
   * @param profileId - ID of the profile to add the movie for
   * @param movieId - TMDB ID of the movie to add
   * @returns Object containing the favorited movie and updated recent/upcoming lists
   */
  public async addMovieToFavorites(profileId: string, movieId: number) {
    try {
      const existingMovieToFavorite = await Movie.findByTMDBId(movieId);
      if (existingMovieToFavorite) {
        return await this.favoriteExistingMovie(existingMovieToFavorite, profileId);
      }

      return await this.favoriteNewMovie(movieId, profileId);
    } catch (error) {
      throw errorService.handleError(error, `addMovieToFavorites(${profileId}, ${movieId})`);
    }
  }

  /**
   * Adds an existing movie to a profile's favorites
   *
   * @param movieToFavorite - Movie to add to favorites
   * @param profileId - ID of the profile to add the movie for
   * @returns Object containing the favorited movie and updated recent/upcoming lists
   */
  private async favoriteExistingMovie(movieToFavorite: Movie, profileId: string) {
    await movieToFavorite.saveFavorite(profileId);

    this.invalidateProfileMovieCache(profileId);

    const newMovie = await Movie.getMovieForProfile(profileId, movieToFavorite.id!);
    const { recentMovies, upcomingMovies } = await this.getRecentUpcomingMoviesForProfile(profileId);

    return {
      favoritedMovie: newMovie,
      recentMovies,
      upcomingMovies,
    };
  }

  /**
   * Adds a new movie (not yet in the database) to a profile's favorites
   * Fetches movie data from TMDB API, saves it to the database, and adds to favorites
   *
   * @param movieId - TMDB ID of the movie to add
   * @param profileId - ID of the profile to add the movie for
   * @returns Object containing the favorited movie and updated recent/upcoming lists
   */
  private async favoriteNewMovie(movieId: number, profileId: string) {
    const tmdbService = getTMDBService();
    const response = await tmdbService.getMovieDetails(movieId);

    const movieToFavorite = new Movie(
      response.id,
      response.title,
      response.overview,
      response.release_date,
      response.runtime,
      response.poster_path,
      response.backdrop_path,
      response.vote_average,
      getUSMPARating(response.release_dates),
      undefined,
      getUSWatchProviders(response, 9998),
      response.genres.map((genre: { id: any }) => genre.id),
    );

    const saveSuccess = await movieToFavorite.save();
    if (!saveSuccess) {
      throw new BadRequestError('Failed to save movie information');
    }

    await movieToFavorite.saveFavorite(profileId);

    const newMovie = await Movie.getMovieForProfile(profileId, movieToFavorite.id!);
    const { recentMovies, upcomingMovies } = await this.getRecentUpcomingMoviesForProfile(profileId);

    this.invalidateProfileMovieCache(profileId);

    return {
      favoritedMovie: newMovie,
      recentMovies,
      upcomingMovies,
    };
  }

  /**
   * Removes a movie from a profile's favorites
   *
   * @param profileId - ID of the profile to remove the movie from
   * @param movieId - ID of the movie to remove
   * @returns Object containing recent and upcoming movies after removal
   */
  public async removeMovieFromFavorites(profileId: string, movieId: number) {
    try {
      const movieToRemove = await Movie.findById(movieId);
      if (!movieToRemove) {
        throw new NotFoundError(`Movie with ID ${movieId} not found`);
      }

      await movieToRemove.removeFavorite(profileId);
      this.invalidateProfileMovieCache(profileId);
      // Invalidate statistics if the service is loaded
      try {
        // Import dynamically to avoid circular dependency
        const { statisticsService } = require('./statisticsService');
        statisticsService.invalidateProfileStatistics(profileId);
      } catch (e) {
        // If statisticsService is not available, skip invalidation
      }

      const { recentMovies, upcomingMovies } = await this.getRecentUpcomingMoviesForProfile(profileId);

      return {
        removedMovie: movieToRemove,
        recentMovies,
        upcomingMovies,
      };
    } catch (error) {
      throw errorService.handleError(error, `removeMovieFromFavorites(${profileId}, ${movieId})`);
    }
  }

  /**
   * Updates the watch status of a movie
   *
   * @param profileId - ID of the profile to update the watch status for
   * @param movieId - ID of the movie to update
   * @param status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
   * @returns Success state of the update operation
   */
  public async updateMovieWatchStatus(profileId: string, movieId: number, status: string) {
    try {
      const success = await Movie.updateWatchStatus(profileId, movieId, status);

      if (!success) {
        throw new BadRequestError(
          `Failed to update watch status. Ensure the movie (ID: ${movieId}) exists in your favorites.`,
        );
      }

      this.cache.invalidate(CACHE_KEYS.PROFILE_MOVIE(profileId, movieId));
      this.cache.invalidate(CACHE_KEYS.PROFILE_MOVIES(profileId));

      // Invalidate statistics if the service is loaded
      try {
        // Import dynamically to avoid circular dependency
        const { statisticsService } = require('./statisticsService');
        statisticsService.invalidateProfileStatistics(profileId);
      } catch (e) {
        // If statisticsService is not available, skip invalidation
      }

      return success;
    } catch (error) {
      throw errorService.handleError(error, `updateMovieWatchStatus(${profileId}, ${movieId}, ${status})`);
    }
  }

  /**
   * Get statistics about a profile's movies
   *
   * @param profileId - ID of the profile to get statistics for
   * @returns Object containing various watch statistics
   */
  public async getProfileMovieStatistics(profileId: string) {
    try {
      return await this.cache.getOrSet(
        `profile_${profileId}_movie_stats`,
        async () => {
          const movies = await Movie.getAllMoviesForProfile(profileId);

          // Calculate basic statistics
          const total = movies.length;
          const watched = movies.filter((m) => m.watch_status === 'WATCHED').length;
          const notWatched = movies.filter((m) => m.watch_status === 'NOT_WATCHED').length;

          // Get genre distribution
          const genreCounts: Record<string, number> = {};
          movies.forEach((movie) => {
            if (movie.genres && typeof movie.genres === 'string') {
              // Split the comma-separated string into an array
              const genreArray = movie.genres.split(',').map((genre) => genre.trim());

              // Count occurrences of each genre
              genreArray.forEach((genre: string) => {
                if (genre) {
                  // Skip empty strings
                  genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                }
              });
            }
          });

          // Get streaming service distribution
          const serviceCounts: Record<string, number> = {};
          movies.forEach((movie) => {
            if (movie.streaming_services && typeof movie.streaming_services === 'string') {
              // Split the comma-separated string into an array
              const serviceArray = movie.streaming_services.split(',').map((service) => service.trim());

              // Count occurrences of each service
              serviceArray.forEach((service: string) => {
                if (service) {
                  // Skip empty strings
                  serviceCounts[service] = (serviceCounts[service] || 0) + 1;
                }
              });
            }
          });

          return {
            total: total,
            watchStatusCounts: { watched, notWatched },
            genreDistribution: genreCounts,
            serviceDistribution: serviceCounts,
            watchProgress: total > 0 ? Math.round((watched / total) * 100) : 0,
          };
        },
        1800, // 30 minutes TTL
      );
    } catch (error) {
      throw errorService.handleError(error, `getProfileMovieStatistics(${profileId})`);
    }
  }
}

// Export a singleton instance of the service
export const moviesService = new MoviesService();
