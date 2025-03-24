import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware';
import Movie from '../models/movie';
import { AccountAndProfileIdsParams } from '../schema/accountSchema';
import { AddMovieFavoriteParams, MovieWatchStatusParams, RemoveMovieFavoriteParams } from '../schema/movieSchema';
import { errorService } from '../services/errorService';
import { getTMDBService } from '../services/tmdbService';
import { getUSMPARating } from '../utils/contentUtility';
import { getUSWatchProviders } from '../utils/watchProvidersUtility';
import { NextFunction, Request, Response } from 'express';

/**
 * Get all movies for a specific profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/movies
 */
export async function getMovies(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;

    const results = await Movie.getAllMoviesForProfile(profileId);

    res.status(200).json({ message: 'Successfully retrieved movies for a profile', results });
  } catch (error) {
    next(error);
  }
}

/**
 * Add a movie to a profile's favorites
 *
 * If the movie doesn't exist in the system, it will fetch details from TMDB
 * and create it before adding it to favorites
 *
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/movies/favorites
 */
export async function addFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const { movieId }: AddMovieFavoriteParams = req.body;

    let movieToFavorite = await Movie.findByTMDBId(movieId);
    if (!movieToFavorite) {
      try {
        const tmdbService = getTMDBService();
        const response = await tmdbService.getMovieDetails(movieId);

        movieToFavorite = new Movie(
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
      } catch (error) {
        if (error instanceof BadRequestError) {
          throw error;
        }
        throw new BadRequestError(`Failed to fetch movie details: ${movieId}`);
      }
    }

    await movieToFavorite.saveFavorite(profileId);

    const newMovie = await Movie.getMovieForProfile(profileId, movieToFavorite.id!);
    const { recentMovies, upcomingMovies } = await getRecentAndUpcomingMovies(profileId);

    res.status(200).json({
      message: `Successfully saved ${movieToFavorite.title} as a favorite`,
      result: { favoritedMovie: newMovie, recentMovies, upcomingMovies },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove a movie from a profile's favorites
 *
 * @route DELETE /api/v1/accounts/:accountId/profiles/:profileId/movies/favorites/:movieId
 */
export async function removeFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId, movieId } = req.params as RemoveMovieFavoriteParams;

    const movieToRemove = await Movie.findById(Number(movieId));

    if (!movieToRemove) {
      throw new NotFoundError(`Movie with ID ${movieId} not found`);
    }

    await movieToRemove.removeFavorite(profileId);
    const { recentMovies, upcomingMovies } = await getRecentAndUpcomingMovies(profileId);

    res.status(200).json({
      message: 'Successfully removed the movie from favorites',
      result: { removedMovie: movieToRemove, recentMovies, upcomingMovies },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update the watch status of a movie
 *
 * @route PUT /api/v1/accounts/:accountId/profiles/:profileId/movies/watchstatus
 */
export async function updateMovieWatchStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const { movieId, status }: MovieWatchStatusParams = req.body;

    const success = await Movie.updateWatchStatus(profileId, movieId, status);

    if (success) {
      res.status(200).json({ message: `Successfully updated the watch status to '${status}'` });
    } else {
      throw new BadRequestError(
        `Failed to update watch status. Ensure the movie (ID: ${movieId}) exists in your favorites.`,
      );
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get recent and upcoming movies for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/movies/recentUpcoming
 */
export async function getRecentUpcomingForProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;

    const { recentMovies, upcomingMovies } = await getRecentAndUpcomingMovies(profileId);

    res.status(200).json({
      message: 'Successfully retrieved recent & upcoming movies for a profile',
      results: { recentMovies, upcomingMovies },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get statistics about a profile's movies
 *
 * @param profileId - ID of the profile to get statistics for
 * @returns Object containing various watch statistics
 */
export async function getProfileMovieStatistics(profileId: string) {
  try {
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
  } catch (error) {
    throw errorService.handleError(error, `getShowStatistics(${profileId})`);
  }
}

/**
 * Retrieves the recent and upcoming movies for a profile
 *
 * @param profileId - ID of the profile to get movies for
 * @returns Object containing recent and upcoming movies arrays
 */
async function getRecentAndUpcomingMovies(profileId: string) {
  const recentMovies = await Movie.getRecentMovieReleasesForProfile(profileId);
  const upcomingMovies = await Movie.getUpcomingMovieReleasesForProfile(profileId);

  return { recentMovies, upcomingMovies };
}
