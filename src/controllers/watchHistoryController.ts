import {
  AccountAndProfileIdsParams,
  MovieParams,
  ProfileEpisodeIdsParams,
  ProfileSeasonIdsParams,
  ShowParams,
  WatchHistoryDismissBody,
  WatchHistoryMarkAsPriorBody,
  WatchHistoryQuery,
} from '@ajgifford/keepwatching-common-server/schema';
import { watchHistoryService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

/**
 * Get shows that appear to have been bulk-marked in watch history.
 * Returns candidates for retroactive prior-watch flagging.
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/watchHistory/bulkMarked
 */
export async function getBulkMarkedShows(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const shows = await watchHistoryService.getBulkMarkedShows(profileId);
    res.status(200).json({ message: 'Successfully retrieved bulk-marked shows', shows });
  } catch (error) {
    next(error);
  }
}

/**
 * Dismiss a bulk-marked show from watch history review.
 * Sets is_prior_watch = TRUE and watched_at = updated_at so the show no longer
 * appears in the bulk-marked query without changing the effective watch dates.
 *
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/watchHistory/dismiss
 */
export async function dismissBulkMarkedShow(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { showId }: WatchHistoryDismissBody = req.body;
    await watchHistoryService.dismissBulkMarkedShow(profileId, showId);
    res.status(200).json({ message: 'Successfully dismissed show from watch history review' });
  } catch (error) {
    next(error);
  }
}

/**
 * Retroactively mark watched episodes for a show as prior-watched.
 * Sets is_prior_watch = TRUE and watched_at = episode air date on matching records.
 *
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/watchHistory/markAsPrior
 */
export async function retroactivelyMarkShowAsPrior(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { showId, seasonIds }: WatchHistoryMarkAsPriorBody = req.body;
    await watchHistoryService.retroactivelyMarkShowAsPrior(accountId, profileId, showId, seasonIds);
    res.status(200).json({ message: 'Successfully marked show episodes as previously watched' });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset a show to NOT_WATCHED so the user can rewatch it from the beginning.
 * Increments rewatch_count so the show still appears in Keep Watching.
 *
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/rewatch
 */
export async function startShowRewatch(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, profileId, showId } = req.params as unknown as ShowParams;
    const statusData = await watchHistoryService.startShowRewatch(accountId, profileId, showId);
    res.status(200).json({ message: 'Successfully started show rewatch', statusData });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset a season to NOT_WATCHED so the user can rewatch it.
 * Show status is recalculated based on remaining season statuses.
 *
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/seasons/:seasonId/rewatch
 */
export async function startSeasonRewatch(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, profileId, seasonId } = req.params as unknown as ProfileSeasonIdsParams;
    const statusData = await watchHistoryService.startSeasonRewatch(accountId, profileId, seasonId);
    res.status(200).json({ message: 'Successfully started season rewatch', statusData });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset a movie to NOT_WATCHED so the user can rewatch it.
 * Increments rewatch_count.
 *
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/movies/:movieId/rewatch
 */
export async function startMovieRewatch(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, profileId, movieId } = req.params as unknown as MovieParams;
    const movie = await watchHistoryService.startMovieRewatch(accountId, profileId, movieId);
    res.status(200).json({ message: 'Successfully started movie rewatch', movie });
  } catch (error) {
    next(error);
  }
}

/**
 * Log a casual single-episode rewatch without resetting watch status.
 *
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/episodes/:episodeId/rewatch
 */
export async function recordEpisodeRewatch(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, profileId, episodeId } = req.params as unknown as ProfileEpisodeIdsParams;
    const result = await watchHistoryService.recordEpisodeRewatch(accountId, profileId, episodeId);
    res.status(200).json({ message: 'Successfully recorded episode rewatch', ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve paginated watch history for a profile.
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/watchHistory
 * Query params: page, pageSize, contentType, sortOrder, dateFrom, dateTo, isPriorWatchOnly, searchQuery
 */
export async function getWatchHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { page, pageSize, contentType, sortOrder, dateFrom, dateTo, isPriorWatchOnly, searchQuery } =
      req.query as unknown as WatchHistoryQuery;
    const history = await watchHistoryService.getHistoryForProfile(
      profileId,
      page,
      pageSize,
      contentType,
      sortOrder,
      dateFrom,
      dateTo,
      isPriorWatchOnly,
      searchQuery,
    );
    res.status(200).json({ message: 'Successfully retrieved watch history', ...history });
  } catch (error) {
    next(error);
  }
}
