import { updateEpisodeWatchStatus, updateNextEpisodeWatchStatus } from '../controllers/episodesController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '../middleware/validationMiddleware';
import { accountAndProfileIdsParamSchema } from '../schema/accountSchema';
import { episodeWatchStatusSchema, nextEpisodeWatchStatusSchema } from '../schema/episodeSchema';
import express from 'express';

const router = express.Router();

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes/watchStatus',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(episodeWatchStatusSchema),
  updateEpisodeWatchStatus,
);

router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId/episodes/nextWatchStatus',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(nextEpisodeWatchStatusSchema),
  updateNextEpisodeWatchStatus,
);

export default router;
