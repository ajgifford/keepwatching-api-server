import {
  getEpisodesForSeason,
  getRecentEpisodes,
  getUpcomingEpisodes,
  updateEpisodeWatchStatus,
} from '../controllers/episodesController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  accountAndProfileIdsParamSchema,
  episodeWatchStatusBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes/watchStatus',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(episodeWatchStatusBodySchema),
  trackAccountActivity,
  updateEpisodeWatchStatus,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/seasons/:seasonId/episodes',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getEpisodesForSeason,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes/upcoming',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getUpcomingEpisodes,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes/recent',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getRecentEpisodes,
);

export default router;
