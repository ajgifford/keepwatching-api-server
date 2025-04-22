import { getSeasonsForShow, updateSeasonWatchStatus } from '../controllers/seasonsController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server/middleware/validationMiddleware';
import { accountAndProfileIdsParamSchema } from '@ajgifford/keepwatching-common-server/schema/accountSchema';
import { seasonWatchStatusSchema } from '@ajgifford/keepwatching-common-server/schema/seasonSchema';
import express from 'express';

const router = express.Router();

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/seasons/watchstatus',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(seasonWatchStatusSchema),
  updateSeasonWatchStatus,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/seasons',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  getSeasonsForShow,
);

export default router;
