import { getSeasonsForShow, updateSeasonWatchStatus } from '../controllers/seasonsController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import {
  accountAndProfileIdsParamSchema,
  seasonWatchStatusBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/seasons/watchstatus',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(seasonWatchStatusBodySchema),
  trackAccountActivity,
  updateSeasonWatchStatus,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/seasons',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getSeasonsForShow,
);

export default router;
