import Movie from '../models/movie';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { createImagePath } from '../utils/imageUtility';
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

interface ProviderInfo {
  link: string;
  flatrate: {
    logo_path: string;
    provider_id: number;
    provider_name: string;
    display_priority: number;
  }[];
}

interface WatchProviders {
  results: Record<string, ProviderInfo>;
}

interface MovieDetails {
  'watch/providers': WatchProviders;
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

function getUSWatchProviders(movie: MovieDetails): string {
  const watchProviders = movie['watch/providers']?.results;
  const usWatchProvider = watchProviders.US;
  return usWatchProvider?.flatrate[0]?.provider_name ?? 'Theater';
}

export const getMovies = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  console.log(`GET /api/profiles/${profileId}/movies`);
  try {
    const results = await Movie.getMoviesForProfile(profileId);
    const json = { message: 'Successfully retrieved movies for a profile', results: results };
    res.status(200).json(json);
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
        createImagePath(responseMovie.poster_path),
        responseMovie.vote_average,
        getUSMPARating(responseMovie.release_dates),
        undefined,
        getUSWatchProviders(responseMovie),
        undefined,
        responseMovie.genres.map((genre: { id: any }) => genre.id),
      );
      await movieToFavorite.save();
    }
    await movieToFavorite.saveFavorite(profileId);
    res
      .status(200)
      .json({ message: `Successfully svaed ${movieToFavorite.title} as a favorite`, results: [movieToFavorite] });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while adding a favorite', error: error });
  }
};

export const updateWatchStatus = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  console.log(`PUT /api/profiles/${profileId}/movies/watchstatus`, req.body);
  try {
    const movie_id = req.body.id;
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
