import { updateEpisodeWatchStatus, updateNextEpisodeWatchStatus } from '../controllers/episodesController';
import { validateRequest } from '../middleware/validationMiddleware';
import { episodeWatchStatusSchema, nextEpisodeWatchStatusSchema, profileIdParamSchema } from '../schema/episodeSchema';
import express from 'express';

const router = express.Router();

router.put(
  '/api/v1/profiles/:profileId/episodes/watchStatus',
  validateRequest(episodeWatchStatusSchema, profileIdParamSchema),
  updateEpisodeWatchStatus,
);

router.put(
  '/api/v1/profiles/:profileId/episodes/nextWatchStatus',
  validateRequest(nextEpisodeWatchStatusSchema, profileIdParamSchema),
  updateNextEpisodeWatchStatus,
);

export default router;
