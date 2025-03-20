import { BadRequestError } from '../middleware/errorMiddleware';
import Movie from '../models/movie';
import { ProfileIdParams } from '../schema/profileSchema';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { getUSMPARating } from '../utils/contentUtility';
import { getUSWatchProviders } from '../utils/watchProvidersUtility';
import { AddMovieFavoriteParams, MovieWatchStatusParams, RemoveMovieFavoriteParams } from '@schema/movieSchema';
import { NextFunction, Request, Response } from 'express';

// GET /api/v1/profiles/${profileId}/movies
export async function getMovies(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;

    const results = await Movie.getAllMoviesForProfile(profileId);

    res.status(200).json({ message: 'Successfully retrieved movies for a profile', results: results });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/profiles/${profileId}/movies/favorites
export async function addFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;
    const { id: movieId }: AddMovieFavoriteParams = req.body;

    let movieToFavorite = await Movie.findByTMDBId(movieId);
    if (!movieToFavorite) {
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
      await movieToFavorite.save();
    }
    await movieToFavorite.saveFavorite(profileId);

    const newMovie = await Movie.getMovieForProfile(profileId, movieToFavorite.id!);
    const recentMovies = await Movie.getRecentMovieReleasesForProfile(profileId);
    const upcomingMovies = await Movie.getUpcomingMovieReleasesForProfile(profileId);

    res.status(200).json({
      message: `Successfully saved ${movieToFavorite.title} as a favorite`,
      result: { favoritedMovie: newMovie, recentMovies: recentMovies, upcomingMovies: upcomingMovies },
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/profiles/${profileId}/movies/favorites/${movieId}
export async function removeFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId, movieId } = req.params as RemoveMovieFavoriteParams;

    const movieToRemove = await Movie.findById(Number(movieId));
    if (movieToRemove) {
      await movieToRemove.removeFavorite(profileId);
      const recentMovies = await Movie.getRecentMovieReleasesForProfile(profileId);
      const upcomingMovies = await Movie.getUpcomingMovieReleasesForProfile(profileId);
      res.status(200).json({
        message: 'Successfully removed the movie from favorites',
        result: { removedMovie: movieToRemove, recentMovies: recentMovies, upcomingMovies: upcomingMovies },
      });
    } else {
      throw new BadRequestError('The movie requested to be removed is not a favorite');
    }
  } catch (error) {
    next(error);
  }
}

// PUT /api/v1/profiles/${profileId}/movies/watchstatus
export async function updateMovieWatchStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;
    const { movie_id, status }: MovieWatchStatusParams = req.body;

    const success = await Movie.updateWatchStatus(profileId, movie_id, status);

    if (success) {
      res.status(200).json({ message: 'Successfully updated the watch status' });
    } else {
      throw new BadRequestError('The watch status for the requested movie was not updated');
    }
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/profiles/${profileId}/movies/recentUpcoming
export async function getRecentUpcomingForProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;

    const recentMovies = await Movie.getRecentMovieReleasesForProfile(profileId);
    const upcomingMovies = await Movie.getUpcomingMovieReleasesForProfile(profileId);

    res.status(200).json({
      message: 'Successfully retrieved recent & upcoming movies for a profile',
      results: { recent: recentMovies, upcoming: upcomingMovies },
    });
  } catch (error) {
    next(error);
  }
}
