import {
  AccountAndProfileIdsParams,
  SeasonWatchStatusBody,
  ShowParams,
} from '@ajgifford/keepwatching-common-server/schema';
import { seasonsService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

/**
 * Update the watch status of a season
 *
 * @route PUT /api/v1/accounts/:accountId/profiles/:profileId/seasons/watchstatus
 */
export const updateSeasonWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { seasonId, status, recursive = false } = req.body as SeasonWatchStatusBody;

    await seasonsService.updateSeasonWatchStatus(accountId, profileId, seasonId, status, recursive);

    res.status(200).json({ message: 'Successfully updated the season watch status' });
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
