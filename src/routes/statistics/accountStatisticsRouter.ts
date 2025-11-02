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
} from '../../controllers/accountStatisticsController';
import { trackAccountActivity } from '../../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { accountIdParamSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/statistics',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountStatistics,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/velocity',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountWatchingVelocity,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/activity/timeline',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountActivityTimeline,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/binge',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountBingeWatchingStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/streaks',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountWatchStreakStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/time-to-watch',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountTimeToWatchStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/seasonal',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountSeasonalViewingStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/milestones',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountMilestoneStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/content-depth',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountContentDepthStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/content-discovery',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountContentDiscoveryStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/abandonment-risk',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountAbandonmentRiskStats,
);

router.get(
  '/api/v1/accounts/:accountId/statistics/unaired-content',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountUnairedContentStats,
);

export default router;
