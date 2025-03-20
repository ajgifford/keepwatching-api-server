import { BadRequestError } from '../middleware/errorMiddleware';
import Episode from '../models/episode';
import Season from '../models/season';
import Show from '../models/show';
import { EpisodeWatchStatusParams, NextEpisodeWatchStatusParams } from '../schema/episodeSchema';
import { ProfileIdParams } from '../schema/profileSchema';
import { NextFunction, Request, Response } from 'express';

// PUT /api/v1/profiles/${profileId}/episodes/watchstatus
export const updateEpisodeWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as ProfileIdParams;
    const { episode_id, status } = req.body as EpisodeWatchStatusParams;

    const success = await Episode.updateWatchStatus(profileId, episode_id, status);
    if (success) {
      const nextUnwatchedEpisodes = await Show.getNextUnwatchedEpisodesForProfile(profileId);
      res.status(200).json({
        message: 'Successfully updated the episode watch status',
        result: { nextUnwatchedEpisodes: nextUnwatchedEpisodes },
      });
    } else {
      throw new BadRequestError('No episode watch status was updated');
    }
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/profiles/${profileId}/episodes/nextWatchstatus
export const updateNextEpisodeWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as ProfileIdParams;
    const { show_id, season_id, episode_id, status } = req.body as NextEpisodeWatchStatusParams;

    const success = await Episode.updateWatchStatus(profileId, episode_id, status);
    if (success) {
      await Season.updateWatchStatusByEpisode(profileId, season_id);
      await Show.updateWatchStatusBySeason(profileId, show_id);
      const nextUnwatchedEpisodes = await Show.getNextUnwatchedEpisodesForProfile(profileId);
      res.status(200).json({
        message: 'Successfully updated the episode watch status',
        result: { nextUnwatchedEpisodes: nextUnwatchedEpisodes },
      });
    } else {
      throw new BadRequestError('No next episode watch status was updated');
    }
  } catch (error) {
    next(error);
  }
};
