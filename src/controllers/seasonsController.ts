import Season from '../models/season';
import { Request, Response } from 'express';

// PUT /api/profiles/${profileId}/seasons/watchstatus
export const updateSeasonWatchStatus = async (req: Request, res: Response) => {
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
      res.status(400).json({ message: 'No status was updated' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while updating a season watch status', error: error });
  }
};
