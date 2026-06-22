import {
  addWatchlistItem,
  getWatchlist,
  removeWatchlistItem,
  updateWatchlistPriorities,
} from '../controllers/watchlistController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  addWatchlistItemBodySchema,
  updateWatchlistPrioritiesBodySchema,
  watchlistItemParamsSchema,
  watchlistParamsSchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/watchlist',
  validateSchema(watchlistParamsSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  getWatchlist,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/watchlist',
  validateSchema(watchlistParamsSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(addWatchlistItemBodySchema),
  logRequestContext,
  trackAccountActivity,
  addWatchlistItem,
);

router.delete(
  '/api/v1/accounts/:accountId/profiles/:profileId/watchlist/:itemId',
  validateSchema(watchlistItemParamsSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  removeWatchlistItem,
);

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/watchlist/priorities',
  validateSchema(watchlistParamsSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(updateWatchlistPrioritiesBodySchema),
  logRequestContext,
  trackAccountActivity,
  updateWatchlistPriorities,
);

export default router;
