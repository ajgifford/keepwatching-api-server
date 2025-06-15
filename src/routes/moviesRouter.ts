import {
  addFavorite,
  getMovieDetails,
  getMovies,
  getRecentUpcomingForProfile,
  removeFavorite,
  updateMovieWatchStatus,
} from '../controllers/moviesController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
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
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  getMovies,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies/favorites',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(addMovieFavoriteBodySchema),
  addFavorite,
);

router.delete(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies/favorites/:movieId',
  validateSchema(removeMovieFavoriteParamSchema, 'params'),
  authorizeAccountAccess,
  removeFavorite,
);

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies/watchstatus',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(movieWatchStatusBodySchema),
  updateMovieWatchStatus,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies/recentUpcoming',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  getRecentUpcomingForProfile,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/movies/:movieId/details',
  validateSchema(movieParamsSchema, 'params'),
  authorizeAccountAccess,
  getMovieDetails,
);

export default router;
