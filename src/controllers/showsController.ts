import { io } from '../index';
import { cliLogger } from '../logger/logger';
import { BadRequestError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import Episode from '../models/episode';
import Season from '../models/season';
import Show from '../models/show';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { getEpisodeToAirId, getInProduction, getUSNetwork, getUSRating } from '../utils/contentUtility';
import { getUSWatchProviders } from '../utils/wacthProvidersUtility';
import { NextFunction, Request, Response } from 'express';

// GET /api/v1/profiles/${profileId}/shows
export async function getShows(req: Request, res: Response) {
  const { profileId } = req.params;
  try {
    const results = await Show.getAllShowsForProfile(profileId);
    res.status(200).json({ message: 'Successfully retrieved shows for a profile', results: results });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while getting shows', error: error });
  }
}

// GET /api/v1/profiles/${profileId}/shows/${showId}/seasons
export async function getShowDetails(req: Request, res: Response) {
  const { profileId, showId } = req.params;
  try {
    const show = await Show.getShowWithSeasonsForProfile(profileId, showId);
    res.status(200).json({ message: 'Successfully retrieved seasons for a show', results: show });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while getting seasons', error: error });
  }
}

// GET /api/v1/profiles/${profileId}/shows/nextWatch
export async function getNextWatchForProfile(req: Request, res: Response) {
  const { profileId } = req.params;
  try {
    const shows = await Show.getNextWatchForProfile(profileId);
    res.status(200).json({ message: 'Successfully retrieved the next watches for a profile', results: shows });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while getting the next watches for a profile', error: error });
  }
}

// POST /api/v1/profiles/${profileId}/shows/favorites
export async function addFavorite(req: Request, res: Response, next: NextFunction) {
  const { profileId } = req.params;
  try {
    const show_id = req.body.id;
    const existingShowToFavorite = await Show.findByTMDBId(show_id);
    if (existingShowToFavorite) {
      await favoriteExistingShowForNewProfile(existingShowToFavorite, profileId, res);
      return;
    }
    await favoriteNewShow(show_id, profileId, res);
  } catch (error) {
    next(error);
  }
}

async function favoriteExistingShowForNewProfile(showToFavorite: Show, profileId: string, res: Response) {
  await showToFavorite.saveFavorite(profileId, true);
  const show = await Show.getShowForProfile(profileId, showToFavorite.id!);
  const nextWatches = await Show.getNextWatchForProfile(profileId);
  res.status(200).json({
    message: `Successfully saved ${showToFavorite.title} as a favorite`,
    result: { favoritedShow: show, nextWatchEpisodes: nextWatches },
  });
}

async function favoriteNewShow(show_id: number, profileId: string, res: Response) {
  const response = await axiosTMDBAPIInstance.get(`/tv/${show_id}?append_to_response=content_ratings,watch/providers`);
  const responseShow = response.data;
  const newShowToFavorite = new Show(
    responseShow.id,
    responseShow.name,
    responseShow.overview,
    responseShow.first_air_date,
    responseShow.poster_path,
    responseShow.backdrop_path,
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
  const isSaved = await newShowToFavorite.save();
  if (!isSaved) {
    throw new BadRequestError('Failed to save the show as a favorite');
  }
  await newShowToFavorite.saveFavorite(profileId, false);
  const show = await Show.getShowForProfile(profileId, newShowToFavorite.id!);
  res
    .status(200)
    .json({ message: `Successfully saved ${newShowToFavorite.title} as a favorite`, result: { favoritedShow: show } });
  fetchSeasonsAndEpisodes(responseShow, newShowToFavorite.id!, profileId);
}

async function fetchSeasonsAndEpisodes(show: any, show_id: number, profileId: string) {
  try {
    for (const responseSeason of show.seasons) {
      const season = new Season(
        show_id,
        responseSeason.id,
        responseSeason.name,
        responseSeason.overview,
        responseSeason.season_number,
        responseSeason.air_date,
        responseSeason.poster_path,
        responseSeason.episode_count,
      );
      await season.save();
      await season.saveFavorite(Number(profileId));

      const response = await axiosTMDBAPIInstance.get(`/tv/${show.id}/season/${season.season_number}`);
      const responseData = response.data;

      for (const responseEpisode of responseData.episodes) {
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
          responseEpisode.still_path,
        );
        await episode.save();
        await episode.saveFavorite(Number(profileId));
      }
    }

    const account_id = await Account.findAccountIdByProfileId(profileId);
    const loadedShow = await Show.getShowForProfile(profileId, show_id);
    const sockets = Array.from(io.sockets.sockets.values());
    const userSocket = sockets.find((socket) => socket.data.accountId === account_id);
    if (userSocket) {
      userSocket.emit('updateShowFavorite', {
        message: 'Show data has been fully loaded',
        show: loadedShow,
      });
    }
  } catch (error) {
    cliLogger.error('Error fetching seasons and episodes:', error);
  }
}

// DELETE /api/v1/profiles/${profileId}/shows/favorites/${showId}
export async function removeFavorite(req: Request, res: Response) {
  const { profileId, showId } = req.params;
  try {
    const showToRemove = await Show.findById(Number(showId));
    if (showToRemove) {
      await showToRemove.removeFavorite(profileId);
      const nextWatches = await Show.getNextWatchForProfile(profileId);
      res.status(200).json({
        message: 'Successfully removed the show from favorites',
        result: { removedShow: showToRemove, nextWatchEpisodes: nextWatches },
      });
    } else {
      throw new BadRequestError('The show requested to remove is not a favorite');
    }
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while removing a favorite', error: error });
  }
}

// PUT /api/v1/profiles/${profileId}/shows/watchstatus
export async function updateShowWatchStatus(req: Request, res: Response) {
  const { profileId } = req.params;
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
}
