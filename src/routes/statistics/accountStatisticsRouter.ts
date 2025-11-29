import {
  getAccountAbandonmentRiskStats,
  getAccountActivityTimeline,
  getAccountBingeWatchingStats,
  getAccountContentDepthStats,
  getAccountContentDiscoveryStats,
  getAccountMilestoneStats,
  getAccountSeasonalViewingStats,
  getAccountStatistics,
  getAccountTimeToWatchStats,
  getAccountUnairedContentStats,
  getAccountWatchStreakStats,
  getAccountWatchingVelocity,
  getProfileComparison,
} from '../../controllers/accountStatisticsController';
import { trackAccountActivity } from '../../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import { accountIdParamSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/statistics',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountStatistics,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/velocity',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountWatchingVelocity,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/activity/timeline',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountActivityTimeline,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/binge',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountBingeWatchingStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/streaks',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountWatchStreakStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/time-to-watch',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountTimeToWatchStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/seasonal',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountSeasonalViewingStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/milestones',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountMilestoneStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/content-depth',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountContentDepthStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/content-discovery',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountContentDiscoveryStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/abandonment-risk',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountAbandonmentRiskStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/unaired-content',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountUnairedContentStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/profile-comparison',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getProfileComparison,
);

export default router;
