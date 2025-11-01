import {
  getAccountStatistics,
  getActivityTimeline,
  getBingeWatchingStats,
  getDailyActivity,
  getMonthlyActivity,
  getProfileStatistics,
  getSeasonalViewingStats,
  getTimeToWatchStats,
  getWatchStreakStats,
  getWatchingVelocity,
  getWeeklyActivity,
} from '../controllers/statisticsController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { accountAndProfileIdsParamSchema, accountIdParamSchema } from '@ajgifford/keepwatching-common-server/schema';
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
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getProfileStatistics,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/velocity',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getWatchingVelocity,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/daily',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getDailyActivity,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/weekly',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getWeeklyActivity,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/monthly',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getMonthlyActivity,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/timeline',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getActivityTimeline,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/binge',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getBingeWatchingStats,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/streaks',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getWatchStreakStats,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/time-to-watch',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getTimeToWatchStats,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics/seasonal',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getSeasonalViewingStats,
);

export default router;
