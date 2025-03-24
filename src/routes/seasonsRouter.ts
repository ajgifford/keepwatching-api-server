import { updateSeasonWatchStatus } from '../controllers/seasonsController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '../middleware/validationMiddleware';
import { accountAndProfileIdsParamSchema } from '../schema/accountSchema';
import { seasonWatchStatusSchema } from '../schema/seasonSchema';
import express from 'express';

const router = express.Router();

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/seasons/watchstatus',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(seasonWatchStatusSchema),
  updateSeasonWatchStatus,
);

export default router;
