import Show from '../models/show';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { createImagePath } from '../utils/imageUtility';
import { Request, Response } from 'express';

interface ContentRating {
  descriptors: string[];
  iso_3166_1: string;
  rating: string;
}

interface ContentRatings {
  results: ContentRating[];
}

interface Network {
  id: string;
  logo_path: string;
  name: string;
  origin_country: string;
}

function getUSRating(contentRatings: ContentRatings): string {
  for (const result of contentRatings.results) {
    if (result.iso_3166_1 === 'US') {
      return result.rating;
    }
  }
  return 'TV-G';
}

function getUSNetwork(networks: Network[]): string {
  for (const network of networks) {
    if (network.origin_country === 'US') {
      return network.name;
    }
  }
  return 'unknown';
}

export const addFavorite = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  console.log(`POST /api/profiles/${profileId}/shows/favorites`, req.body);

  try {
    const show_id = req.body.id;
    let showToFavorite = await Show.findByTMDBId(show_id);
    if (!showToFavorite) {
      const response = await axiosTMDBAPIInstance.get(`/tv/${show_id}?append_to_response=content_ratings`);
      const responseShow = response.data;
      showToFavorite = new Show(
        responseShow.id,
        responseShow.name,
        responseShow.overview,
        responseShow.first_air_date,
        createImagePath(responseShow.poster_path),
        responseShow.vote_average,
        getUSRating(responseShow.content_ratings),
        undefined,
        getUSNetwork(responseShow.networks),
        responseShow.number_of_seasons,
        responseShow.number_of_episodes,
        undefined,
        responseShow.genres.map((genre: { id: any }) => genre.id),
      );
      await showToFavorite.save();
    }
    await showToFavorite.saveFavorite(profileId);
    res
      .status(200)
      .json({ message: `Successfully saved ${showToFavorite.title} as a favorite`, results: [showToFavorite] });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while adding a favorite', error: error });
  }
};

export const updateWatchStatus = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  console.log(`PUT /api/profiles/${profileId}/shows/watchstatus`, req.body);
  try {
    const show_id = req.body.id;
    const status = req.body.status;
    const success = await Show.updateWatchStatus(profileId, show_id, status);
    if (success) {
      res.status(200).json({ message: 'Successfully updated the watch status' });
    } else {
      res.status(400).json({ message: 'No status was updated' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while updating a watch status', error: error });
  }
};
