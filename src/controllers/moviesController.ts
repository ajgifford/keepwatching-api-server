import {
  AccountAndProfileIdsParams,
  AddMovieFavoriteParams,
  MovieWatchStatusParams,
  RemoveMovieFavoriteParams,
} from '@ajgifford/keepwatching-common-server/schema';
import { moviesService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

/**
 * Get all movies for a specific profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/movies
 */
export async function getMovies(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;

    const results = await moviesService.getMoviesForProfile(profileId);

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

    const result = await moviesService.addMovieToFavorites(profileId, movieId);

    res.status(200).json({
      message: `Successfully saved movie as a favorite`,
      result,
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

    const result = await moviesService.removeMovieFromFavorites(profileId, Number(movieId));

    res.status(200).json({
      message: 'Successfully removed the movie from favorites',
      result,
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

    await moviesService.updateMovieWatchStatus(profileId, movieId, status);

    res.status(200).json({ message: `Successfully updated the watch status to '${status}'` });
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

    const recentMovies = await moviesService.getRecentMoviesForProfile(profileId);
    const upcomingMovies = await moviesService.getUpcomingMoviesForProfile(profileId);

    res.status(200).json({
      message: 'Successfully retrieved recent & upcoming movies for a profile',
      results: { recentMovies, upcomingMovies },
    });
  } catch (error) {
    next(error);
  }
}
