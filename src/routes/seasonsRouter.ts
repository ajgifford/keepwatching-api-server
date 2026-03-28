import { getSeasonsForShow, markSeasonIdsAsPriorWatched, updateSeasonWatchStatus } from '../controllers/seasonsController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  accountAndProfileIdsParamSchema,
  seasonPriorWatchBodySchema,
  seasonWatchStatusBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/seasons/watchstatus',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(seasonWatchStatusBodySchema),
  trackAccountActivity,
  updateSeasonWatchStatus,
);

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/seasons/priorWatchStatus',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(seasonPriorWatchBodySchema),
  trackAccountActivity,
  markSeasonIdsAsPriorWatched,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/seasons',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getSeasonsForShow,
);

export default router;
