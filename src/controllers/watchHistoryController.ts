import {
  AccountAndProfileIdsParams,
  WatchHistoryDismissBody,
  WatchHistoryMarkAsPriorBody,
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
