import {
  AccountAndProfileIdsParams,
  SeasonPriorWatchBody,
  SeasonWatchStatusBody,
  ShowParams,
} from '@ajgifford/keepwatching-common-server/schema';
import { seasonsService, watchHistoryService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

/**
 * Update the watch status of a season
 *
 * @route PUT /api/v1/accounts/:accountId/profiles/:profileId/seasons/watchstatus
 */
export const updateSeasonWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { seasonId, status } = req.body as SeasonWatchStatusBody;

    const statusData = await seasonsService.updateSeasonWatchStatus(accountId, profileId, seasonId, status);

    res.status(200).json({
      message: 'Successfully updated the season watch status',
      statusData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark specific seasons as previously watched using each episode's air date
 *
 * @route PUT /api/v1/accounts/:accountId/profiles/:profileId/seasons/priorWatchStatus
 */
export const markSeasonIdsAsPriorWatched = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { seasonIds, showId } = req.body as SeasonPriorWatchBody;

    const statusData = await watchHistoryService.markSeasonIdsAsPriorWatched(accountId, profileId, showId, seasonIds);

    res.status(200).json({
      message: 'Successfully marked seasons as previously watched',
      statusData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all the seasons for the specified show
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/seasons
 */
export const getSeasonsForShow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId, showId } = req.params as unknown as ShowParams;

    const seasons = await seasonsService.getSeasonsForShow(profileId, showId);

    res.status(200).json({
      message: 'Successfully retrieved seasons for the show',
      results: seasons,
    });
  } catch (error) {
    next(error);
  }
};
