import { BadRequestError } from '../middleware/errorMiddleware';
import Season from '../models/season';
import { NextFunction, Request, Response } from 'express';

// PUT /api/v1/profiles/${profileId}/seasons/watchstatus
export const updateSeasonWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { profileId } = req.params;
  try {
    const season_id = req.body.season_id;
    const status = req.body.status;
    const recursive: boolean = req.body.recursive;
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
