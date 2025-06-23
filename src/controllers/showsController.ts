import {
  AccountAndProfileIdsParams,
  AddShowFavoriteBody,
  ShowParams,
  ShowWatchStatusBody,
} from '@ajgifford/keepwatching-common-server/schema';
import { showService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

/**
 * Get all shows for a specific profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/shows
 */
export async function getShows(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const shows = await showService.getShowsForProfile(profileId);
    res.status(200).json({ message: 'Successfully retrieved shows for a profile', shows });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a show and all it's details for a specific profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/details
 */
export async function getShowDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, profileId, showId } = req.params as unknown as ShowParams;
    const show = await showService.getShowDetailsForProfile(accountId, profileId, showId);
    res.status(200).json({ message: 'Successfully retrieved a show and its details', show });
  } catch (error) {
    next(error);
  }
}

/**
 * Get episode data (recent, upcoming and next unwatched) for a specific profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/episodes
 */
export async function getProfileEpisodes(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const episodes = await showService.getEpisodesForProfile(profileId);
    res.status(200).json({ message: 'Successfully retrieved the episodes for a profile', episodes });
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
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/shows/favorites
 */
export async function addFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { showTMDBId }: AddShowFavoriteBody = req.body;
    const result = await showService.addShowToFavorites(accountId, profileId, showTMDBId);
    res.status(200).json({
      message: `Successfully saved show as a favorite`,
      addedShow: result.favoritedShow,
      episodes: result.episodes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove a show from a profile's favorites
 *
 * @route DELETE /api/v1/accounts/:accountId/profiles/:profileId/shows/favorites/:showId
 */
export async function removeFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, profileId, showId } = req.params as unknown as ShowParams;
    const result = await showService.removeShowFromFavorites(accountId, profileId, showId);
    res.status(200).json({
      message: 'Successfully removed the show from favorites',
      removedShowReference: result.removedShow,
      episodes: result.episodes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update the watch status of a show
 *
 * @route PUT /api/v1/accounts/:accountId/profiles/:profileId/shows/watchstatus
 */
export async function updateShowWatchStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { showId, status } = req.body as ShowWatchStatusBody;

    const data = await showService.updateShowWatchStatus(accountId, profileId, showId, status);

    res.status(200).json({ message: `Successfully updated the watch status to '${status}'`, data });
  } catch (error) {
    next(error);
  }
}

/**
 * Get recommended shows based on a specific show
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/recommendations
 */
export async function getShowRecommendations(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId, showId } = req.params as unknown as ShowParams;
    const shows = await showService.getShowRecommendations(profileId, showId);

    res.status(200).json({
      message: 'Successfully retrieved show recommendations',
      shows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get similar shows based on a specific show
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/similar
 */
export async function getSimilarShows(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId, showId } = req.params as unknown as ShowParams;
    const shows = await showService.getSimilarShows(profileId, showId);

    res.status(200).json({
      message: 'Successfully retrieved similar shows',
      shows,
    });
  } catch (error) {
    next(error);
  }
}
