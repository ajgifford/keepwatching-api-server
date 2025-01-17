import { BadRequestError } from '../middleware/errorMiddleware';
import Episode from '../models/episode';
import Season from '../models/season';
import Show from '../models/show';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { buildTMDBImagePath } from '../utils/imageUtility';
import { getUSWatchProviders } from '../utils/wacthProvidersUtility';
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

function getUSNetwork(networks: Network[]): string | null {
  for (const network of networks) {
    if (network.origin_country === 'US') {
      return network.name;
    }
  }
  return null;
}

function getUSRating(contentRatings: ContentRatings): string {
  for (const result of contentRatings.results) {
    if (result.iso_3166_1 === 'US') {
      return result.rating;
    }
  }
  return 'TV-G';
}

function getInProduction(show: { in_production: boolean }): 0 | 1 {
  return show.in_production ? 1 : 0;
}

function getEpisodeToAirId(episode: { id: number } | null) {
  if (episode) {
    return episode.id;
  }
  return null;
}

export const getShows = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  console.log(`GET /api/profiles/${profileId}/shows`);
  try {
    const results = await Show.getAllShowsForProfile(profileId);
    res.status(200).json({ message: 'Successfully retrieved shows for a profile', results: results });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while getting shows', error: error });
  }
};

export const getShowDetails = async (req: Request, res: Response) => {
  const { profileId, showId } = req.params;
  console.log(`GET /api/profiles/${profileId}/shows/${showId}/seasons`);
  try {
    const show = await Show.getShowWithSeasonsForProfile(profileId, showId);
    res.status(200).json({ message: 'Successfully retrieved seasons for a show', results: show });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while getting seasons', error: error });
  }
};

export const getNextWatchForProfile = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  console.log(`GET /api/profiles/${profileId}/shows/nextWatch`);
  try {
    const shows = await Show.getNextWatchForProfile(profileId);
    res.status(200).json({ message: 'Successfully retrieved the next watches for a profile', results: shows });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while getting the next watches for a profile', error: error });
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  console.log(`POST /api/profiles/${profileId}/shows/favorites`, req.body);

  try {
    const show_id = req.body.id;
    const existingShowToFavorite = await Show.findByTMDBId(show_id);
    if (existingShowToFavorite) {
      return favoriteExistingShowForNewProfile(existingShowToFavorite, profileId, res);
    }
    favoriteNewShow(show_id, profileId, res);
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while adding a favorite', error: error });
  }
};

const favoriteExistingShowForNewProfile = async (showToFavorite: Show, profileId: string, res: Response) => {
  await showToFavorite.saveFavorite(profileId, true);
  const show = await Show.getShowForProfile(profileId, showToFavorite.id!);
  res.status(200).json({ message: `Successfully saved ${showToFavorite.title} as a favorite`, result: show });
};

const favoriteNewShow = async (show_id: number, profileId: string, res: Response) => {
  const response = await axiosTMDBAPIInstance.get(`/tv/${show_id}?append_to_response=content_ratings,watch/providers`);
  const responseShow = response.data;
  const newShowToFavorite = new Show(
    responseShow.id,
    responseShow.name,
    responseShow.overview,
    responseShow.first_air_date,
    buildTMDBImagePath(responseShow.poster_path),
    responseShow.vote_average,
    getUSRating(responseShow.content_ratings),
    undefined,
    getUSWatchProviders(responseShow, 9999),
    responseShow.number_of_episodes,
    responseShow.number_of_seasons,
    responseShow.genres.map((genre: { id: any }) => genre.id),
    responseShow.status,
    responseShow.type,
    getInProduction(responseShow),
    responseShow.last_air_date,
    getEpisodeToAirId(responseShow.last_episode_to_air),
    getEpisodeToAirId(responseShow.next_episode_to_air),
    getUSNetwork(responseShow.networks),
  );
  await newShowToFavorite.save();
  await newShowToFavorite.saveFavorite(profileId, false);
  const show = await Show.getShowForProfile(profileId, newShowToFavorite.id!);
  res.status(200).json({ message: `Successfully saved ${newShowToFavorite.title} as a favorite`, result: show });
  fetchSeasonsAndEpisodes(responseShow, newShowToFavorite.id!, profileId);
};

const fetchSeasonsAndEpisodes = async (show: any, show_id: number, profileId: string) => {
  show.seasons.map(async (responseSeason: any) => {
    const season = new Season(
      show_id,
      responseSeason.id,
      responseSeason.name,
      responseSeason.overview,
      responseSeason.season_number,
      responseSeason.air_date,
      buildTMDBImagePath(responseSeason.poster_path),
      responseSeason.episode_count,
    );
    await season.save();
    await season.saveFavorite(profileId);

    const response = await axiosTMDBAPIInstance.get(`/tv/${show.id}/season/${season.season_number}`);
    const responseData = response.data;
    const episodes = responseData.episodes.map(async (responseEpisode: any) => {
      const episode = new Episode(
        responseEpisode.id,
        show_id,
        season.id!,
        responseEpisode.episode_number,
        responseEpisode.episode_type,
        responseEpisode.season_number,
        responseEpisode.name,
        responseEpisode.overview,
        responseEpisode.air_date,
        responseEpisode.runtime,
        buildTMDBImagePath(responseEpisode.still_path),
      );
      await episode.save();
      await episode.saveFavorite(profileId);
    });
    season.episodes = episodes;
    return season;
  });
};

export const removeFavorite = async (req: Request, res: Response) => {
  const { profileId, showId } = req.params;
  console.log(`DELETE /api/profiles/${profileId}/shows/favorites/${showId}`);

  try {
    const showToRemove = await Show.findById(Number(showId));
    if (showToRemove) {
      showToRemove.removeFavorite(profileId);
      res.status(200).json({ message: 'Successfully removed the show from favorites', result: showToRemove });
    } else {
      throw new BadRequestError('Failed to remove the show as a favorite');
    }
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while removing a favorite', error: error });
  }
};

export const updateShowWatchStatus = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  console.log(`PUT /api/profiles/${profileId}/shows/watchstatus`, req.body);
  try {
    const show_id = req.body.show_id;
    const status = req.body.status;
    const recursive: boolean = req.body.recursive;
    const success = recursive
      ? await Show.updateAllWatchStatuses(profileId, show_id, status)
      : await Show.updateWatchStatus(profileId, show_id, status);
    if (success) {
      res.status(200).json({ message: 'Successfully updated the show watch status' });
    } else {
      res.status(400).json({ message: 'No status was updated' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while updating a show watch status', error: error });
  }
};

export const updateShows = async (req: Request, res: Response) => {
  console.log(`POST /api/updateShows`);
  res.sendStatus(202);
};
