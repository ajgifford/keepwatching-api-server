import Episode from '../models/episode';
import { Request, Response } from 'express';

// PUT /api/v1/profiles/${profileId}/episodes/watchstatus
export const updateEpisodeWatchStatus = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  try {
    const episode_id = req.body.episode_id;
    const status = req.body.status;
    const success = await Episode.updateWatchStatus(profileId, episode_id, status);
    if (success) {
      res.status(200).json({ message: 'Successfully updated the episode watch status' });
    } else {
      res.status(400).json({ message: 'No status was updated' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while updating a episode watch status', error: error });
  }
};
