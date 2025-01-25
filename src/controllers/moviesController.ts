import { BadRequestError } from '../middleware/errorMiddleware';
import Movie from '../models/movie';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { getUSMPARating } from '../utils/contentUtility';
import { buildTMDBImagePath } from '../utils/imageUtility';
import { getUSWatchProviders } from '../utils/wacthProvidersUtility';
import { Request, Response } from 'express';

// GET /api/v1/profiles/${profileId}/movies
export const getMovies = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  try {
    const results = await Movie.getAllMoviesForProfile(profileId);
    res.status(200).json({ message: 'Successfully retrieved movies for a profile', results: results });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while getting movies', error: error });
  }
};

// POST /api/v1/profiles/${profileId}/movies/favorites
export const addFavorite = async (req: Request, res: Response) => {
  const { profileId } = req.params;

  try {
    const movie_id = req.body.id;
    let movieToFavorite = await Movie.findByTMDBId(movie_id);
    if (!movieToFavorite) {
      const response = await axiosTMDBAPIInstance.get(
        `/movie/${movie_id}?append_to_response=release_dates%2Cwatch%2Fproviders&language=en-US`,
      );
      const responseMovie = response.data;
      movieToFavorite = new Movie(
        responseMovie.id,
        responseMovie.title,
        responseMovie.overview,
        responseMovie.release_date,
        responseMovie.runtime,
        buildTMDBImagePath(responseMovie.poster_path),
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
    res.status(200).json({ message: `Successfully saved ${movieToFavorite.title} as a favorite`, result: newMovie });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while adding a favorite', error: error });
  }
};

// DELETE /api/v1/profiles/${profileId}/movies/favorites/${movieId}
export const removeFavorite = async (req: Request, res: Response) => {
  const { profileId, movieId } = req.params;
  try {
    const movieToRemove = await Movie.findById(Number(movieId));
    if (movieToRemove) {
      movieToRemove.removeFavorite(profileId);
      res.status(200).json({ message: 'Successfully removed the movie from favorites', result: movieToRemove });
    } else {
      throw new BadRequestError('Failed to remove the movie as a favorite');
    }
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while removing a favorite', error: error });
  }
};

// PUT /api/v1/profiles/${profileId}/movies/watchstatus
export const updateMovieWatchStatus = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  try {
    const movie_id = req.body.movie_id;
    const status = req.body.status;
    const success = await Movie.updateWatchStatus(profileId, movie_id, status);
    if (success) {
      res.status(200).json({ message: 'Successfully updated the watch status' });
    } else {
      res.status(400).json({ message: 'No status was updated' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while updating a watch status', error: error });
  }
};
