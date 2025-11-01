import { AccountAndProfileIdsParams, AccountIdParam } from '@ajgifford/keepwatching-common-server/schema';
import { statisticsService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

/**
 * Get statistics (shows, movies and watch progress) for an account
 *
 * @route GET /api/v1/accounts/:accountId/statistics
 */
export async function getAccountStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params as unknown as AccountIdParam;
    const results = await statisticsService.getAccountStatistics(accountId);

    res.status(200).json({
      message: 'Successfully retrieved account statistics',
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get statistics (shows, movies and watch progress) for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics
 */
export async function getProfileStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const results = await statisticsService.getProfileStatistics(profileId);

    res.status(200).json({
      message: 'Successfully retrieved profile statistics',
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get watching velocity statistics for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/velocity
 */
export async function getWatchingVelocity(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const results = await statisticsService.getWatchingVelocity(profileId, days);

    res.status(200).json({
      message: 'Successfully retrieved watching velocity statistics',
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get daily activity timeline for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/daily
 */
export async function getDailyActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const results = await statisticsService.getDailyActivity(profileId, days);

    res.status(200).json({
      message: 'Successfully retrieved daily activity',
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get weekly activity timeline for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/weekly
 */
export async function getWeeklyActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const weeks = req.query.weeks ? parseInt(req.query.weeks as string, 10) : 12;
    const results = await statisticsService.getWeeklyActivity(profileId, weeks);

    res.status(200).json({
      message: 'Successfully retrieved weekly activity',
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get monthly activity timeline for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/monthly
 */
export async function getMonthlyActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const months = req.query.months ? parseInt(req.query.months as string, 10) : 12;
    const results = await statisticsService.getMonthlyActivity(profileId, months);

    res.status(200).json({
      message: 'Successfully retrieved monthly activity',
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get comprehensive activity timeline for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/timeline
 */
export async function getActivityTimeline(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const results = await statisticsService.getActivityTimeline(profileId);

    res.status(200).json({
      message: 'Successfully retrieved activity timeline',
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get binge-watching statistics for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/binge
 */
export async function getBingeWatchingStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const results = await statisticsService.getBingeWatchingStats(profileId);

    res.status(200).json({
      message: 'Successfully retrieved binge-watching statistics',
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get watch streak statistics for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/streaks
 */
export async function getWatchStreakStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const results = await statisticsService.getWatchStreakStats(profileId);

    res.status(200).json({
      message: 'Successfully retrieved watch streak statistics',
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get time-to-watch statistics for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/time-to-watch
 */
export async function getTimeToWatchStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const results = await statisticsService.getTimeToWatchStats(profileId);

    res.status(200).json({
      message: 'Successfully retrieved time-to-watch statistics',
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get seasonal viewing pattern statistics for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/seasonal
 */
export async function getSeasonalViewingStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const results = await statisticsService.getSeasonalViewingStats(profileId);

    res.status(200).json({
      message: 'Successfully retrieved seasonal viewing statistics',
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get milestone statistics for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/milestones
 */
export async function getMilestoneStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const results = await statisticsService.getMilestoneStats(profileId);

    res.status(200).json({
      message: 'Successfully retrieved milestone statistics',
      results,
    });
  } catch (error) {
    next(error);
  }
}
