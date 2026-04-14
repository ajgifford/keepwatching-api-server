import { deleteRating, getRatingsForProfile, upsertRating } from '../controllers/ratingsController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  ratingParamsSchema,
  ratingProfileParamsSchema,
  upsertRatingBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/ratings',
  logRequestContext,
  validateSchema(ratingProfileParamsSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getRatingsForProfile,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/ratings',
  logRequestContext,
  validateSchema(ratingProfileParamsSchema, 'params'),
  validateSchema(upsertRatingBodySchema, 'body'),
  authorizeAccountAccess,
  trackAccountActivity,
  upsertRating,
);

router.delete(
  '/api/v1/accounts/:accountId/profiles/:profileId/ratings/:ratingId',
  logRequestContext,
  validateSchema(ratingParamsSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  deleteRating,
);

export default router;
