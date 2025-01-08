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

function getUSRating(contentRatings: ContentRatings): string {
  for (const result of contentRatings.results) {
    if (result.iso_3166_1 === 'US') {
      return result.rating;
    }
  }
  return 'TV-G';
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

export const getSeasons = async (req: Request, res: Response) => {
  const { profileId, showId } = req.params;
  console.log(`GET /api/profiles/${profileId}/shows/${showId}/seasons`);
  try {
    const show = await Show.getShowWithSeasonsForProfile(profileId, showId);
    res.status(200).json({ message: 'Successfully retrieved seasons for a show', results: [show] });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while getting seasons', error: error });
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
  res.status(200).json({ message: `Successfully saved ${showToFavorite.title} as a favorite`, results: [show] });
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
  );
  await newShowToFavorite.save();
  await newShowToFavorite.saveFavorite(profileId, false);
  const show = await Show.getShowForProfile(profileId, newShowToFavorite.id!);
  res.status(200).json({ message: `Successfully saved ${newShowToFavorite.title} as a favorite`, results: [show] });
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
