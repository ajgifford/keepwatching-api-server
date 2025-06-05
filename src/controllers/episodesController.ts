import {
  AccountAndProfileIdsParams,
  EpisodeWatchStatusBody,
  NextEpisodeWatchStatusBody,
  ProfileSeasonIdsParams,
} from '@ajgifford/keepwatching-common-server/schema';
import { episodesService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

// PUT /api/v1/accounts/:accountId/profiles/${profileId}/episodes/watchStatus
export const updateEpisodeWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { episodeId, status } = req.body as EpisodeWatchStatusBody;

    const episodes = await episodesService.updateEpisodeWatchStatus(accountId, profileId, episodeId, status);

    res.status(200).json({
      message: 'Successfully updated the episode watch status',
      nextUnwatchedEpisodes: episodes,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/accounts/:accountId/profiles/${profileId}/episodes/nextWatchStatus
export const updateNextEpisodeWatchStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { showId, seasonId, episodeId, status } = req.body as NextEpisodeWatchStatusBody;

    const episodes = await episodesService.updateNextEpisodeWatchStatus(
      accountId,
      profileId,
      showId,
      seasonId,
      episodeId,
      status,
    );

    res.status(200).json({
      message: 'Successfully updated the episode watch status',
      nextUnwatchedEpisodes: episodes,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/accounts/:accountId/profiles/:profileId/seasons/:seasonId/episodes
export const getEpisodesForSeason = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId, seasonId } = req.params as unknown as ProfileSeasonIdsParams;

    const episodes = await episodesService.getEpisodesForSeason(profileId, seasonId);

    res.status(200).json({
      message: 'Successfully retrieved episodes for the season',
      results: episodes,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/accounts/:accountId/profiles/:profileId/episodes/upcoming
export const getUpcomingEpisodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;

    const episodes = await episodesService.getUpcomingEpisodesForProfile(profileId);

    res.status(200).json({
      message: 'Successfully retrieved upcoming episodes',
      results: episodes,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/accounts/:accountId/profiles/:profileId/episodes/recent
export const getRecentEpisodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;

    const episodes = await episodesService.getRecentEpisodesForProfile(profileId);

    res.status(200).json({
      message: 'Successfully retrieved recent episodes',
      results: episodes,
    });
  } catch (error) {
    next(error);
  }
};
