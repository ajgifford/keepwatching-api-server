import Episode from '../models/episode';
import Season from '../models/season';
import Show from '../models/show';
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
    res.status(500).json({ message: 'Unexpected error while updating an episode watch status', error: error });
  }
};

// PUT /api/v1/profiles/${profileId}/episodes/watchstatus
export const updateNextEpisodeWatchStatus = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  try {
    const showId = req.body.show_id;
    const seasonId = req.body.season_id;
    const episodeId = req.body.episode_id;
    const status = req.body.status;

    const success = await Episode.updateWatchStatus(profileId, episodeId, status);
    if (success) {
      await Season.updateWatchStatusByEpisode(profileId, seasonId);
      await Show.updateWatchStatusBySeason(profileId, showId);
      const nextUnwatchedEpisodes = await Show.getNextUnwatchedEpisodesForProfile(profileId);
      res.status(200).json({
        message: 'Successfully updated the episode watch status',
        result: { nextUnwatchedEpisodes: nextUnwatchedEpisodes },
      });
    } else {
      res.status(400).json({ message: 'No status was updated' });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Unexpected error while updating the watch status of a keep watching episode', error: error });
  }
};
