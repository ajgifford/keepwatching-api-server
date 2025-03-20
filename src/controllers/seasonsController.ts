import { BadRequestError } from '../middleware/errorMiddleware';
import Season from '../models/season';
import { ProfileIdParams } from '../schema/profileSchema';
import { SeasonWatchStatusParams } from '../schema/seasonSchema';
import { NextFunction, Request, Response } from 'express';

// PUT /api/v1/profiles/${profileId}/seasons/watchstatus
export const updateSeasonWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as ProfileIdParams;
    const { season_id, status, recursive = false } = req.body as SeasonWatchStatusParams;

    const success = recursive
      ? await Season.updateAllWatchStatuses(profileId, season_id, status)
      : await Season.updateWatchStatus(profileId, season_id, status);
    if (success) {
      res.status(200).json({ message: 'Successfully updated the season watch status' });
    } else {
      throw new BadRequestError('No season watch status was updated');
    }
  } catch (error) {
    next(error);
  }
};
