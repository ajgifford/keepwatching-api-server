import {
  dismissBulkMarkedShow,
  getBulkMarkedShows,
  getWatchHistory,
  recordEpisodeRewatch,
  retroactivelyMarkShowAsPrior,
  startMovieRewatch,
  startSeasonRewatch,
  startShowRewatch,
} from '../controllers/watchHistoryController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  accountAndProfileIdsParamSchema,
  movieParamsSchema,
  profileEpisodeIdsParamSchema,
  profileSeasonIdsParamSchema,
  showParamsSchema,
  watchHistoryDismissBodySchema,
  watchHistoryMarkAsPriorBodySchema,
  watchHistoryQuerySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/watchHistory/bulkMarked',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  getBulkMarkedShows,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/watchHistory',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  validateSchema(watchHistoryQuerySchema, 'query'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  getWatchHistory,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/watchHistory/markAsPrior',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(watchHistoryMarkAsPriorBodySchema),
  logRequestContext,
  trackAccountActivity,
  retroactivelyMarkShowAsPrior,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/watchHistory/dismiss',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(watchHistoryDismissBodySchema),
  logRequestContext,
  trackAccountActivity,
  dismissBulkMarkedShow,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/rewatch',
  validateSchema(showParamsSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  startShowRewatch,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/seasons/:seasonId/rewatch',
  validateSchema(profileSeasonIdsParamSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  startSeasonRewatch,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies/:movieId/rewatch',
  validateSchema(movieParamsSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  startMovieRewatch,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes/:episodeId/rewatch',
  validateSchema(profileEpisodeIdsParamSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  recordEpisodeRewatch,
);

export default router;
