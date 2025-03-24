import { BadRequestError } from '../middleware/errorMiddleware';
import Episode from '../models/episode';
import Season from '../models/season';
import Show from '../models/show';
import { AccountAndProfileIdsParams } from '../schema/accountSchema';
import { EpisodeWatchStatusParams, NextEpisodeWatchStatusParams } from '../schema/episodeSchema';
import { NextFunction, Request, Response } from 'express';

// PUT /api/v1/profiles/${profileId}/episodes/watchstatus
export const updateEpisodeWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const { episodeId, status } = req.body as EpisodeWatchStatusParams;

    const success = await Episode.updateWatchStatus(profileId, episodeId, status);
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
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const { showId, seasonId, episodeId, status } = req.body as NextEpisodeWatchStatusParams;

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
      throw new BadRequestError('No next episode watch status was updated');
    }
  } catch (error) {
    next(error);
  }
};
