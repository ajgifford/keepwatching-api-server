import {
  getAbandonmentRiskStats,
  getActivityTimeline,
  getBingeWatchingStats,
  getContentDepthStats,
  getContentDiscoveryStats,
  getDailyActivity,
  getMilestoneStats,
  getMonthlyActivity,
  getProfileStatistics,
  getSeasonalViewingStats,
  getTimeToWatchStats,
  getUnairedContentStats,
  getWatchStreakStats,
  getWatchingVelocity,
  getWeeklyActivity,
} from '../../controllers/profileStatisticsController';
import { trackAccountActivity } from '../../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import { accountAndProfileIdsParamSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getProfileStatistics,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/velocity',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getWatchingVelocity,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/daily',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getDailyActivity,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/weekly',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getWeeklyActivity,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/monthly',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getMonthlyActivity,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/timeline',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getActivityTimeline,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/binge',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getBingeWatchingStats,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/streaks',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getWatchStreakStats,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/time-to-watch',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getTimeToWatchStats,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/seasonal',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getSeasonalViewingStats,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/milestones',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getMilestoneStats,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/content-depth',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getContentDepthStats,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/content-discovery',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getContentDiscoveryStats,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/abandonment-risk',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAbandonmentRiskStats,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/unaired-content',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getUnairedContentStats,
);

export default router;
