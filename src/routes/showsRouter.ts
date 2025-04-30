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
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import {
  accountAndProfileIdsParamSchema,
  addShowFavoriteSchema,
  showParamsSchema,
  showWatchStatusSchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  getShows,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/favorites',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(addShowFavoriteSchema),
  addFavorite,
);

router.delete(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/favorites/:showId',
  validateSchema(showParamsSchema, 'params'),
  authorizeAccountAccess,
  removeFavorite,
);

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/watchstatus',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(showWatchStatusSchema),
  updateShowWatchStatus,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/details',
  validateSchema(showParamsSchema, 'params'),
  authorizeAccountAccess,
  getShowDetails,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  getProfileEpisodes,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/recommendations',
  validateSchema(showParamsSchema, 'params'),
  authorizeAccountAccess,
  getShowRecommendations,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/similar',
  validateSchema(showParamsSchema, 'params'),
  authorizeAccountAccess,
  getSimilarShows,
);

export default router;
