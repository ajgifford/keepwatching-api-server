import Movie from '../models/movie';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { buildTMDBImagePath } from '../utils/imageUtility';
import { getUSWatchProviders } from '../utils/wacthProvidersUtility';
import { Request, Response } from 'express';

interface ReleaseDates {
  results: ReleaseDate[];
}

interface ReleaseDate {
  iso_3166_1: string;
  release_dates: Release[];
}

interface Release {
  certification: string;
  descriptors: string[];
  iso_639_1: string;
  note: string;
  release_date: Date;
  type: number;
}

function getUSMPARating(releaseDates: ReleaseDates): string {
  for (const releaseDate of releaseDates.results) {
    if (releaseDate.iso_3166_1 === 'US') {
      const release: Release = releaseDate.release_dates[0];
      return release.certification;
    }
  }
  return 'PG';
}

export const getMovies = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  console.log(`GET /api/profiles/${profileId}/movies`);
  try {
    const results = await Movie.getAllMoviesForProfile(profileId);
    res.status(200).json({ message: 'Successfully retrieved movies for a profile', results: results });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while getting movies', error: error });
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  console.log(`POST /api/profiles/${profileId}/movies/favorites`, req.body);

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
    res.status(200).json({ message: `Successfully saved ${movieToFavorite.title} as a favorite`, results: [newMovie] });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while adding a favorite', error: error });
  }
};

export const updateMovieWatchStatus = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  console.log(`PUT /api/profiles/${profileId}/movies/watchstatus`, req.body);
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
