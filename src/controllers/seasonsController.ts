import { AccountAndProfileIdsParams } from '../schema/accountSchema';
import { SeasonWatchStatusParams } from '../schema/seasonSchema';
import { seasonsService } from '../services/seasonsService';
import { NextFunction, Request, Response } from 'express';

// PUT /api/v1/accounts/:accountId/profiles/:profileId/seasons/watchstatus
export const updateSeasonWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const { seasonId, status, recursive = false } = req.body as SeasonWatchStatusParams;

    await seasonsService.updateSeasonWatchStatus(profileId, seasonId, status, recursive);

    res.status(200).json({ message: 'Successfully updated the season watch status' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/seasons
export const getSeasonsForShow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const { showId } = req.params;

    const seasons = await seasonsService.getSeasonsForShow(profileId, showId);

    res.status(200).json({
      message: 'Successfully retrieved seasons for the show',
      results: seasons,
    });
  } catch (error) {
    next(error);
  }
};
