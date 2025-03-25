import { BadRequestError } from '../middleware/errorMiddleware';
import Season from '../models/season';
import { AccountAndProfileIdsParams } from '../schema/accountSchema';
import { SeasonWatchStatusParams } from '../schema/seasonSchema';
import { showService } from '../services/showService';
import { NextFunction, Request, Response } from 'express';

// PUT /api/v1/accounts/:accountId/profiles/:profileId/seasons/watchstatus
export const updateSeasonWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const { seasonId, status, recursive = false } = req.body as SeasonWatchStatusParams;

    const success = recursive
      ? await Season.updateAllWatchStatuses(profileId, seasonId, status)
      : await Season.updateWatchStatus(profileId, seasonId, status);
    if (success) {
      showService.invalidateProfileCache(profileId);

      res.status(200).json({ message: 'Successfully updated the season watch status' });
    } else {
      throw new BadRequestError('No season watch status was updated');
    }
  } catch (error) {
    next(error);
  }
};
