import {
  addRecommendation,
  getCommunityRecommendations,
  getProfileRecommendations,
  getRecommendationDetails,
  removeRecommendation,
} from '../controllers/communityRecommendationsController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  communityRecommendationsQuerySchema,
  contentRecommendationDetailsParamsSchema,
  ratingProfileParamsSchema,
  sendRecommendationBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

// Community feed — no account ownership check needed, just authentication (applied in index.ts)
router.get(
  '/api/v1/community/recommendations',
  logRequestContext,
  validateSchema(communityRecommendationsQuerySchema, 'query'),
  getCommunityRecommendations,
);

router.get(
  '/api/v1/community/recommendations/:contentType/:contentId',
  logRequestContext,
  validateSchema(contentRecommendationDetailsParamsSchema, 'params'),
  getRecommendationDetails,
);

// Profile-scoped recommendation routes
router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/recommendations',
  logRequestContext,
  validateSchema(ratingProfileParamsSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getProfileRecommendations,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/recommendations',
  logRequestContext,
  validateSchema(ratingProfileParamsSchema, 'params'),
  validateSchema(sendRecommendationBodySchema, 'body'),
  authorizeAccountAccess,
  trackAccountActivity,
  addRecommendation,
);

router.delete(
  '/api/v1/accounts/:accountId/profiles/:profileId/recommendations',
  logRequestContext,
  validateSchema(ratingProfileParamsSchema, 'params'),
  validateSchema(sendRecommendationBodySchema, 'body'),
  authorizeAccountAccess,
  trackAccountActivity,
  removeRecommendation,
);

export default router;
