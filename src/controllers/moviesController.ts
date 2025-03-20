import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware';
import Movie from '../models/movie';
import { ProfileIdParams } from '../schema/profileSchema';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { getUSMPARating } from '../utils/contentUtility';
import { getUSWatchProviders } from '../utils/watchProvidersUtility';
import { AddMovieFavoriteParams, MovieWatchStatusParams, RemoveMovieFavoriteParams } from '@schema/movieSchema';
import { NextFunction, Request, Response } from 'express';

/**
 * Get all movies for a specific profile
 *
 * @route GET /api/v1/profiles/:profileId/movies
 */
export async function getMovies(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;

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
 * @route POST /api/v1/profiles/:profileId/movies/favorites
 */
export async function addFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;
    const { id: movieId }: AddMovieFavoriteParams = req.body;

    let movieToFavorite = await Movie.findByTMDBId(movieId);
    if (!movieToFavorite) {
      try {
        const response = await axiosTMDBAPIInstance.get(
          `/movie/${movieId}?append_to_response=release_dates%2Cwatch%2Fproviders&language=en-US`,
        );

        const responseMovie = response.data;

        movieToFavorite = new Movie(
          responseMovie.id,
          responseMovie.title,
          responseMovie.overview,
          responseMovie.release_date,
          responseMovie.runtime,
          responseMovie.poster_path,
          responseMovie.backdrop_path,
          responseMovie.vote_average,
          getUSMPARating(responseMovie.release_dates),
          undefined,
          getUSWatchProviders(responseMovie, 9998),
          responseMovie.genres.map((genre: { id: any }) => genre.id),
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
 * @route DELETE /api/v1/profiles/:profileId/movies/favorites/:movieId
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
 * @route PUT /api/v1/profiles/:profileId/movies/watchstatus
 */
export async function updateMovieWatchStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;
    const { movie_id, status }: MovieWatchStatusParams = req.body;

    const success = await Movie.updateWatchStatus(profileId, movie_id, status);

    if (success) {
      res.status(200).json({ message: `Successfully updated the watch status to '${status}'` });
    } else {
      throw new BadRequestError(
        `Failed to update watch status. Ensure the movie (ID: ${movie_id}) exists in your favorites.`,
      );
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get recent and upcoming movies for a profile
 *
 * @route GET /api/v1/profiles/:profileId/movies/recentUpcoming
 */
export async function getRecentUpcomingForProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;

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
