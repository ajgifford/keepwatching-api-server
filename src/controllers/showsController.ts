import { AccountAndProfileIdsParams } from '../schema/accountSchema';
import { AddShowFavoriteParams, ShowParams, ShowWatchStatusParams } from '../schema/showSchema';
import { showService } from '../services/showService';
import { NextFunction, Request, Response } from 'express';

/**
 * Get all shows for a specific profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/shows
 */
export async function getShows(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const results = await showService.getShowsForProfile(profileId);

    res.status(200).json({ message: 'Successfully retrieved shows for a profile', results });
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
    const { profileId, showId } = req.params as ShowParams;
    const show = await showService.getShowDetailsForProfile(profileId, showId);

    res.status(200).json({ message: 'Successfully retrieved a show and its details', results: show });
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
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const episodeData = await showService.getEpisodesForProfile(profileId);

    res.status(200).json({ message: 'Successfully retrieved the episodes for a profile', results: episodeData });
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
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const { showId: showId }: AddShowFavoriteParams = req.body;

    const result = await showService.addShowToFavorites(profileId, showId);

    res.status(200).json({ message: `Successfully saved show as a favorite`, result });
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
    const { profileId, showId } = req.params as ShowParams;
    const result = await showService.removeShowFromFavorites(profileId, Number(showId));

    res.status(200).json({ message: 'Successfully removed the show from favorites', result });
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
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const { showId: show_id, status, recursive = false } = req.body as ShowWatchStatusParams;

    await showService.updateShowWatchStatus(profileId, show_id, status, recursive);

    res.status(200).json({ message: `Successfully updated the watch status to '${status}'` });
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
    const { profileId, showId } = req.params as ShowParams;
    const recommendations = await showService.getShowRecommendations(profileId, Number(showId));

    res.status(200).json({
      message: 'Successfully retrieved show recommendations',
      results: recommendations,
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
    const { profileId, showId } = req.params as ShowParams;
    const similarShows = await showService.getSimilarShows(profileId, Number(showId));

    res.status(200).json({
      message: 'Successfully retrieved similar shows',
      results: similarShows,
    });
  } catch (error) {
    next(error);
  }
}
