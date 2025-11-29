import {
  addFavorite,
  getMovieDetails,
  getMovies,
  getRecentUpcomingForProfile,
  removeFavorite,
  updateMovieWatchStatus,
} from '../controllers/moviesController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  accountAndProfileIdsParamSchema,
  addMovieFavoriteBodySchema,
  movieParamsSchema,
  movieWatchStatusBodySchema,
  removeMovieFavoriteParamSchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getMovies,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies/favorites',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(addMovieFavoriteBodySchema),
  trackAccountActivity,
  addFavorite,
);

router.delete(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies/favorites/:movieId',
  logRequestContext,
  validateSchema(removeMovieFavoriteParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  removeFavorite,
);

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies/watchstatus',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(movieWatchStatusBodySchema),
  trackAccountActivity,
  updateMovieWatchStatus,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies/recentUpcoming',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getRecentUpcomingForProfile,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies/:movieId/details',
  logRequestContext,
  validateSchema(movieParamsSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getMovieDetails,
);

export default router;
