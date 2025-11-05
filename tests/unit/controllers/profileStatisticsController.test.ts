import { profileStatisticsService } from '@ajgifford/keepwatching-common-server/testing';
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
} from '@controllers/profileStatisticsController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({ profileStatisticsService }));

describe('profileStatisticsController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getProfileStatistics', () => {
    it('should return profile statistics successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = {
        showStatistics: { total: 10 },
        movieStatistics: { total: 5 },
        episodeWatchProgress: { watchedEpisodes: 50 },
      };

      (profileStatisticsService.getProfileStatistics as jest.Mock).mockResolvedValue(mockStats);

      await getProfileStatistics(req, res, next);

      expect(profileStatisticsService.getProfileStatistics).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved profile statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get profile statistics');
      (profileStatisticsService.getProfileStatistics as jest.Mock).mockRejectedValue(error);

      await getProfileStatistics(req, res, next);

      expect(profileStatisticsService.getProfileStatistics).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getWatchingVelocity', () => {
    it('should return watching velocity statistics with default days parameter', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = { averageEpisodesPerDay: 2.5 };

      (profileStatisticsService.getWatchingVelocity as jest.Mock).mockResolvedValue(mockStats);

      await getWatchingVelocity(req, res, next);

      expect(profileStatisticsService.getWatchingVelocity).toHaveBeenCalledWith(123, 30);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved watching velocity statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return watching velocity statistics with custom days parameter', async () => {
      req.params = { accountId: 1, profileId: 123 };
      req.query = { days: '60' };
      const mockStats = { averageEpisodesPerDay: 2.5 };

      (profileStatisticsService.getWatchingVelocity as jest.Mock).mockResolvedValue(mockStats);

      await getWatchingVelocity(req, res, next);

      expect(profileStatisticsService.getWatchingVelocity).toHaveBeenCalledWith(123, 60);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved watching velocity statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get watching velocity');
      (profileStatisticsService.getWatchingVelocity as jest.Mock).mockRejectedValue(error);

      await getWatchingVelocity(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getDailyActivity', () => {
    it('should return daily activity with default days parameter', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = [{ date: '2025-01-01', count: 5 }];

      (profileStatisticsService.getDailyActivity as jest.Mock).mockResolvedValue(mockStats);

      await getDailyActivity(req, res, next);

      expect(profileStatisticsService.getDailyActivity).toHaveBeenCalledWith(123, 30);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved daily activity',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return daily activity with custom days parameter', async () => {
      req.params = { accountId: 1, profileId: 123 };
      req.query = { days: '7' };
      const mockStats = [{ date: '2025-01-01', count: 5 }];

      (profileStatisticsService.getDailyActivity as jest.Mock).mockResolvedValue(mockStats);

      await getDailyActivity(req, res, next);

      expect(profileStatisticsService.getDailyActivity).toHaveBeenCalledWith(123, 7);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved daily activity',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get daily activity');
      (profileStatisticsService.getDailyActivity as jest.Mock).mockRejectedValue(error);

      await getDailyActivity(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getWeeklyActivity', () => {
    it('should return weekly activity with default weeks parameter', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = [{ week: '2025-W01', count: 20 }];

      (profileStatisticsService.getWeeklyActivity as jest.Mock).mockResolvedValue(mockStats);

      await getWeeklyActivity(req, res, next);

      expect(profileStatisticsService.getWeeklyActivity).toHaveBeenCalledWith(123, 12);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved weekly activity',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return weekly activity with custom weeks parameter', async () => {
      req.params = { accountId: 1, profileId: 123 };
      req.query = { weeks: '24' };
      const mockStats = [{ week: '2025-W01', count: 20 }];

      (profileStatisticsService.getWeeklyActivity as jest.Mock).mockResolvedValue(mockStats);

      await getWeeklyActivity(req, res, next);

      expect(profileStatisticsService.getWeeklyActivity).toHaveBeenCalledWith(123, 24);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved weekly activity',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get weekly activity');
      (profileStatisticsService.getWeeklyActivity as jest.Mock).mockRejectedValue(error);

      await getWeeklyActivity(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getMonthlyActivity', () => {
    it('should return monthly activity with default months parameter', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = [{ month: '2025-01', count: 50 }];

      (profileStatisticsService.getMonthlyActivity as jest.Mock).mockResolvedValue(mockStats);

      await getMonthlyActivity(req, res, next);

      expect(profileStatisticsService.getMonthlyActivity).toHaveBeenCalledWith(123, 12);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved monthly activity',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return monthly activity with custom months parameter', async () => {
      req.params = { accountId: 1, profileId: 123 };
      req.query = { months: '6' };
      const mockStats = [{ month: '2025-01', count: 50 }];

      (profileStatisticsService.getMonthlyActivity as jest.Mock).mockResolvedValue(mockStats);

      await getMonthlyActivity(req, res, next);

      expect(profileStatisticsService.getMonthlyActivity).toHaveBeenCalledWith(123, 6);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved monthly activity',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get monthly activity');
      (profileStatisticsService.getMonthlyActivity as jest.Mock).mockRejectedValue(error);

      await getMonthlyActivity(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getActivityTimeline', () => {
    it('should return activity timeline successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = {
        daily: [{ date: '2025-01-01', count: 5 }],
        weekly: [{ week: '2025-W01', count: 20 }],
        monthly: [{ month: '2025-01', count: 50 }],
      };

      (profileStatisticsService.getActivityTimeline as jest.Mock).mockResolvedValue(mockStats);

      await getActivityTimeline(req, res, next);

      expect(profileStatisticsService.getActivityTimeline).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved activity timeline',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get activity timeline');
      (profileStatisticsService.getActivityTimeline as jest.Mock).mockRejectedValue(error);

      await getActivityTimeline(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getBingeWatchingStats', () => {
    it('should return binge-watching statistics successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = { longestBingeSession: 10, averageBingeLength: 5 };

      (profileStatisticsService.getBingeWatchingStats as jest.Mock).mockResolvedValue(mockStats);

      await getBingeWatchingStats(req, res, next);

      expect(profileStatisticsService.getBingeWatchingStats).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved binge-watching statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get binge-watching stats');
      (profileStatisticsService.getBingeWatchingStats as jest.Mock).mockRejectedValue(error);

      await getBingeWatchingStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getWatchStreakStats', () => {
    it('should return watch streak statistics successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = { currentStreak: 5, longestStreak: 15 };

      (profileStatisticsService.getWatchStreakStats as jest.Mock).mockResolvedValue(mockStats);

      await getWatchStreakStats(req, res, next);

      expect(profileStatisticsService.getWatchStreakStats).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved watch streak statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get watch streak stats');
      (profileStatisticsService.getWatchStreakStats as jest.Mock).mockRejectedValue(error);

      await getWatchStreakStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getTimeToWatchStats', () => {
    it('should return time-to-watch statistics successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = { averageTimeToWatch: 3.5, medianTimeToWatch: 2.0 };

      (profileStatisticsService.getTimeToWatchStats as jest.Mock).mockResolvedValue(mockStats);

      await getTimeToWatchStats(req, res, next);

      expect(profileStatisticsService.getTimeToWatchStats).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved time-to-watch statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get time-to-watch stats');
      (profileStatisticsService.getTimeToWatchStats as jest.Mock).mockRejectedValue(error);

      await getTimeToWatchStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getSeasonalViewingStats', () => {
    it('should return seasonal viewing statistics successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = { spring: 20, summer: 30, fall: 25, winter: 35 };

      (profileStatisticsService.getSeasonalViewingStats as jest.Mock).mockResolvedValue(mockStats);

      await getSeasonalViewingStats(req, res, next);

      expect(profileStatisticsService.getSeasonalViewingStats).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved seasonal viewing statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get seasonal viewing stats');
      (profileStatisticsService.getSeasonalViewingStats as jest.Mock).mockRejectedValue(error);

      await getSeasonalViewingStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getMilestoneStats', () => {
    it('should return milestone statistics successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = { milestones: [{ name: '100 Episodes', achieved: true }] };

      (profileStatisticsService.getMilestoneStats as jest.Mock).mockResolvedValue(mockStats);

      await getMilestoneStats(req, res, next);

      expect(profileStatisticsService.getMilestoneStats).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved milestone statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get milestone stats');
      (profileStatisticsService.getMilestoneStats as jest.Mock).mockRejectedValue(error);

      await getMilestoneStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getContentDepthStats', () => {
    it('should return content depth statistics successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = { averageShowsPerGenre: 5.2, genreDepth: { Drama: 10, Comedy: 8 } };

      (profileStatisticsService.getContentDepthStats as jest.Mock).mockResolvedValue(mockStats);

      await getContentDepthStats(req, res, next);

      expect(profileStatisticsService.getContentDepthStats).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved content depth statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get content depth stats');
      (profileStatisticsService.getContentDepthStats as jest.Mock).mockRejectedValue(error);

      await getContentDepthStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getContentDiscoveryStats', () => {
    it('should return content discovery statistics successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = { newShowsPerMonth: 2.5, discoveryRate: 0.3 };

      (profileStatisticsService.getContentDiscoveryStats as jest.Mock).mockResolvedValue(mockStats);

      await getContentDiscoveryStats(req, res, next);

      expect(profileStatisticsService.getContentDiscoveryStats).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved content discovery statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get content discovery stats');
      (profileStatisticsService.getContentDiscoveryStats as jest.Mock).mockRejectedValue(error);

      await getContentDiscoveryStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAbandonmentRiskStats', () => {
    it('should return abandonment risk statistics successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = { atRiskShows: 5, abandonmentRate: 0.15 };

      (profileStatisticsService.getAbandonmentRiskStats as jest.Mock).mockResolvedValue(mockStats);

      await getAbandonmentRiskStats(req, res, next);

      expect(profileStatisticsService.getAbandonmentRiskStats).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved abandonment risk statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get abandonment risk stats');
      (profileStatisticsService.getAbandonmentRiskStats as jest.Mock).mockRejectedValue(error);

      await getAbandonmentRiskStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getUnairedContentStats', () => {
    it('should return unaired content statistics successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = { unairedEpisodes: 10, unairedShows: 3 };

      (profileStatisticsService.getUnairedContentStats as jest.Mock).mockResolvedValue(mockStats);

      await getUnairedContentStats(req, res, next);

      expect(profileStatisticsService.getUnairedContentStats).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved unaired content statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const error = new Error('Failed to get unaired content stats');
      (profileStatisticsService.getUnairedContentStats as jest.Mock).mockRejectedValue(error);

      await getUnairedContentStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
