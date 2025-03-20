import { updateSeasonWatchStatus } from '../controllers/seasonsController';
import { validateRequest } from '../middleware/validationMiddleware';
import { profileIdParamSchema } from '../schema/profileSchema';
import { seasonWatchStatusSchema } from '../schema/seasonSchema';
import express from 'express';

const router = express.Router();

router.put(
  '/api/v1/profiles/:profileId/seasons/watchstatus',
  validateRequest(seasonWatchStatusSchema, profileIdParamSchema),
  updateSeasonWatchStatus,
);

export default router;
