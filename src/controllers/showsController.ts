import { io } from '../index';
import { cliLogger } from '../logger/logger';
import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import Episode from '../models/episode';
import Season from '../models/season';
import Show from '../models/show';
import { ProfileIdParams } from '../schema/profileSchema';
import { AddShowFavoriteParams, ShowAndProfileParams, ShowWatchStatusParams } from '../schema/showSchema';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { getEpisodeToAirId, getInProduction, getUSNetwork, getUSRating } from '../utils/contentUtility';
import { getUSWatchProviders } from '../utils/watchProvidersUtility';
import { NextFunction, Request, Response } from 'express';

/**
 * Get all shows for a specific profile
 *
 * @route GET /api/v1/profiles/:profileId/shows
 */
export async function getShows(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;

    const results = await Show.getAllShowsForProfile(profileId);

    res.status(200).json({ message: 'Successfully retrieved shows for a profile', results });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a show and all it's details for a specific profile
 *
 * @route GET /api/v1/profiles/:profileId/shows/:showId/details
 */
export async function getShowDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId, showId } = req.params as ShowAndProfileParams;

    const show = await Show.getShowDetailsForProfile(profileId, showId);

    if (!show) {
      throw new NotFoundError(`Show with ID ${showId} not found`);
    }

    res.status(200).json({ message: 'Successfully retrieved a show and its details', results: show });
  } catch (error) {
    next(error);
  }
}

/**
 * Get episode data (recent, upcoming and next unwatched) for a specific profile
 *
 * @route GET /api/v1/profiles/:profileId/episodes
 */
export async function getProfileEpisodes(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;

    const { recentEpisodes, upcomingEpisodes, nextUnwatchedEpisodes } = await getEpisodes(profileId);

    res.status(200).json({
      message: 'Successfully retrieved the episodes for a profile',
      results: {
        upcomingEpisodes,
        recentEpisodes,
        nextUnwatchedEpisodes,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add a show to a profile's favorites
 *
 * If the show doesn't exist in the system, it will fetch details from TMDB
 * and create it before adding it to favorites
 *
 * @route POST /api/v1/profiles/:profileId/shows/favorites
 */
export async function addFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;
    const { id: showId }: AddShowFavoriteParams = req.body;

    const existingShowToFavorite = await Show.findByTMDBId(showId);

    if (existingShowToFavorite) {
      await favoriteExistingShowForNewProfile(existingShowToFavorite, profileId, res);
      return;
    }
    await favoriteNewShow(showId, profileId, res);
  } catch (error) {
    next(error);
  }
}

/**
 * Favorite an existing show for the profile
 */
async function favoriteExistingShowForNewProfile(showToFavorite: Show, profileId: string, res: Response) {
  await showToFavorite.saveFavorite(profileId, true);

  const show = await Show.getShowForProfile(profileId, showToFavorite.id!);

  const { recentEpisodes, upcomingEpisodes, nextUnwatchedEpisodes } = await getEpisodes(profileId);

  res.status(200).json({
    message: `Successfully saved ${showToFavorite.title} as a favorite`,
    result: { favoritedShow: show, upcomingEpisodes, recentEpisodes, nextUnwatchedEpisodes },
  });
}

/**
 * Favorite a new show (one that is not yet in the database and needs to be loaded from TMDB)
 */
async function favoriteNewShow(showId: number, profileId: string, res: Response) {
  try {
    const response = await axiosTMDBAPIInstance.get(`/tv/${showId}?append_to_response=content_ratings,watch/providers`);

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
    res.status(200).json({
      message: `Successfully saved ${newShowToFavorite.title} as a favorite`,
      result: { favoritedShow: show },
    });
    fetchSeasonsAndEpisodes(responseShow, newShowToFavorite.id!, profileId);
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    throw new BadRequestError(`Failed to fetch show details: ${showId}`);
  }
}

/**
 * Loads all of the season and episode data for a show from the TMDB API
 */
async function fetchSeasonsAndEpisodes(show: any, showId: number, profileId: string): Promise<void> {
  try {
    for (const responseSeason of show.seasons) {
      const season = new Season(
        showId,
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
          showId,
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
    const loadedShow = await Show.getShowForProfile(profileId, showId);
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

/**
 * Remove a show from a profile's favorites
 *
 * @route DELETE /api/v1/profiles/:profileId/shows/favorites/:showId
 */
export async function removeFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId, showId } = req.params as ShowAndProfileParams;

    const showToRemove = await Show.findById(Number(showId));

    if (!showToRemove) {
      throw new NotFoundError(`Show with ID ${showId} not found`);
    }

    await showToRemove.removeFavorite(profileId);
    const { recentEpisodes, upcomingEpisodes, nextUnwatchedEpisodes } = await getEpisodes(profileId);

    res.status(200).json({
      message: 'Successfully removed the show from favorites',
      result: {
        removedShow: showToRemove,
        upcomingEpisodes,
        recentEpisodes,
        nextUnwatchedEpisodes,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update the watch status of a show
 *
 * @route PUT /api/v1/profiles/:profileId/shows/watchstatus
 */
export async function updateShowWatchStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as ProfileIdParams;
    const { show_id, status, recursive = false } = req.body as ShowWatchStatusParams;

    const success = recursive
      ? await Show.updateAllWatchStatuses(profileId, show_id, status)
      : await Show.updateWatchStatus(profileId, show_id, status);

    if (success) {
      res.status(200).json({ message: `Successfully updated the watch status to '${status}'` });
    } else {
      throw new BadRequestError(
        `Failed to update watch status. Ensure the show (ID: ${show_id}) exists in your favorites.`,
      );
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves the recent, upcoming and next unwatched episodes for a profile
 *
 * @param profileId - ID of the profile to get episodes for
 * @returns Object containing recent, upcoming and next unwatched episodes arrays
 */
async function getEpisodes(profileId: string) {
  const recentEpisodes = await Episode.getRecentEpisodesForProfile(profileId);
  const upcomingEpisodes = await Episode.getUpcomingEpisodesForProfile(profileId);
  const nextUnwatchedEpisodes = await Show.getNextUnwatchedEpisodesForProfile(profileId);

  return { recentEpisodes, upcomingEpisodes, nextUnwatchedEpisodes };
}
