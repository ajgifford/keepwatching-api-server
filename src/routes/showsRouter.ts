import {
  addFavorite,
  getProfileEpisodes,
  getShowDetails,
  getShowRecommendations,
  getShows,
  getSimilarShows,
  removeFavorite,
  updateShowWatchStatus,
} from '../controllers/showsController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  accountAndProfileIdsParamSchema,
  addShowFavoriteBodySchema,
  showParamsSchema,
  showWatchStatusBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  getShows,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/favorites',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(addShowFavoriteBodySchema),
  logRequestContext,
  trackAccountActivity,
  addFavorite,
);

router.delete(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/favorites/:showId',
  validateSchema(showParamsSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  removeFavorite,
);

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/watchstatus',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(showWatchStatusBodySchema),
  logRequestContext,
  trackAccountActivity,
  updateShowWatchStatus,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/details',
  logRequestContext,
  validateSchema(showParamsSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getShowDetails,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  getProfileEpisodes,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/recommendations',
  validateSchema(showParamsSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  getShowRecommendations,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/similar',
  validateSchema(showParamsSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  getSimilarShows,
);

export default router;
