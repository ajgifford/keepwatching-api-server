import {
  getEpisodesForSeason,
  getRecentEpisodes,
  getUpcomingEpisodes,
  updateEpisodeWatchStatus,
  updateNextEpisodeWatchStatus,
} from '../controllers/episodesController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import {
  accountAndProfileIdsParamSchema,
  episodeWatchStatusBodySchema,
  nextEpisodeWatchStatusBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes/watchStatus',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(episodeWatchStatusBodySchema),
  updateEpisodeWatchStatus,
);

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes/nextWatchStatus',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(nextEpisodeWatchStatusBodySchema),
  updateNextEpisodeWatchStatus,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/seasons/:seasonId/episodes',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  getEpisodesForSeason,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes/upcoming',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  getUpcomingEpisodes,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes/recent',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  getRecentEpisodes,
);

export default router;
