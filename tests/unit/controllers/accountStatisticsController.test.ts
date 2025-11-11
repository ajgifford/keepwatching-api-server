import { accountStatisticsService } from '@ajgifford/keepwatching-common-server/services';
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
} from '@controllers/accountStatisticsController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  accountStatisticsService: {
    getAccountStatistics: jest.fn(),
    getAccountWatchingVelocity: jest.fn(),
    getAccountActivityTimeline: jest.fn(),
    getAccountBingeWatchingStats: jest.fn(),
    getAccountWatchStreakStats: jest.fn(),
    getAccountTimeToWatchStats: jest.fn(),
    getAccountSeasonalViewingStats: jest.fn(),
    getAccountMilestoneStats: jest.fn(),
    getAccountContentDepthStats: jest.fn(),
    getAccountContentDiscoveryStats: jest.fn(),
    getAccountAbandonmentRiskStats: jest.fn(),
    getAccountUnairedContentStats: jest.fn(),
    getProfileComparison: jest.fn(),
  },
}));

describe('accountStatisticsController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getAccountStatistics', () => {
    it('should return account statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        profileCount: 2,
        uniqueContent: { showCount: 15, movieCount: 10 },
        showStatistics: { total: 15 },
        movieStatistics: { total: 10 },
        episodeStatistics: { totalEpisodes: 100, watchedEpisodes: 50 },
      };

      (accountStatisticsService.getAccountStatistics as jest.Mock).mockResolvedValue(mockStats);

      await getAccountStatistics(req, res, next);

      expect(accountStatisticsService.getAccountStatistics).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get account statistics');
      (accountStatisticsService.getAccountStatistics as jest.Mock).mockRejectedValue(error);

      await getAccountStatistics(req, res, next);

      expect(accountStatisticsService.getAccountStatistics).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccountWatchingVelocity', () => {
    it('should return account watching velocity statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        episodesPerDay: 2.5,
        moviesPerMonth: 10,
        busiestDay: 'Saturday',
      };

      (accountStatisticsService.getAccountWatchingVelocity as jest.Mock).mockResolvedValue(mockStats);

      await getAccountWatchingVelocity(req, res, next);

      expect(accountStatisticsService.getAccountWatchingVelocity).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account watching velocity statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get watching velocity');
      (accountStatisticsService.getAccountWatchingVelocity as jest.Mock).mockRejectedValue(error);

      await getAccountWatchingVelocity(req, res, next);

      expect(accountStatisticsService.getAccountWatchingVelocity).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccountActivityTimeline', () => {
    it('should return account activity timeline statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        timeline: [
          { date: '2024-01-01', episodes: 5, movies: 2 },
          { date: '2024-01-02', episodes: 3, movies: 1 },
        ],
      };

      (accountStatisticsService.getAccountActivityTimeline as jest.Mock).mockResolvedValue(mockStats);

      await getAccountActivityTimeline(req, res, next);

      expect(accountStatisticsService.getAccountActivityTimeline).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account activity timeline statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get activity timeline');
      (accountStatisticsService.getAccountActivityTimeline as jest.Mock).mockRejectedValue(error);

      await getAccountActivityTimeline(req, res, next);

      expect(accountStatisticsService.getAccountActivityTimeline).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccountBingeWatchingStats', () => {
    it('should return account binge watching statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        bingeSessionCount: 15,
        longestBingeSession: { episodes: 10, duration: 420 },
        averageBingeLength: 5,
      };

      (accountStatisticsService.getAccountBingeWatchingStats as jest.Mock).mockResolvedValue(mockStats);

      await getAccountBingeWatchingStats(req, res, next);

      expect(accountStatisticsService.getAccountBingeWatchingStats).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account binge watching statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get binge watching stats');
      (accountStatisticsService.getAccountBingeWatchingStats as jest.Mock).mockRejectedValue(error);

      await getAccountBingeWatchingStats(req, res, next);

      expect(accountStatisticsService.getAccountBingeWatchingStats).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccountWatchStreakStats', () => {
    it('should return account watch streak statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        currentStreak: 7,
        longestStreak: 30,
        totalStreaks: 5,
      };

      (accountStatisticsService.getAccountWatchStreakStats as jest.Mock).mockResolvedValue(mockStats);

      await getAccountWatchStreakStats(req, res, next);

      expect(accountStatisticsService.getAccountWatchStreakStats).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account watch streak statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get watch streak stats');
      (accountStatisticsService.getAccountWatchStreakStats as jest.Mock).mockRejectedValue(error);

      await getAccountWatchStreakStats(req, res, next);

      expect(accountStatisticsService.getAccountWatchStreakStats).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccountTimeToWatchStats', () => {
    it('should return account time to watch statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        averageTimeToWatch: 5.5,
        fastestShow: { showId: 1, timeToWatch: 1.2 },
        slowestShow: { showId: 2, timeToWatch: 30.5 },
      };

      (accountStatisticsService.getAccountTimeToWatchStats as jest.Mock).mockResolvedValue(mockStats);

      await getAccountTimeToWatchStats(req, res, next);

      expect(accountStatisticsService.getAccountTimeToWatchStats).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account time to watch statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get time to watch stats');
      (accountStatisticsService.getAccountTimeToWatchStats as jest.Mock).mockRejectedValue(error);

      await getAccountTimeToWatchStats(req, res, next);

      expect(accountStatisticsService.getAccountTimeToWatchStats).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccountSeasonalViewingStats', () => {
    it('should return account seasonal viewing statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        seasonalPattern: {
          spring: 150,
          summer: 200,
          fall: 175,
          winter: 225,
        },
        busiestSeason: 'winter',
      };

      (accountStatisticsService.getAccountSeasonalViewingStats as jest.Mock).mockResolvedValue(mockStats);

      await getAccountSeasonalViewingStats(req, res, next);

      expect(accountStatisticsService.getAccountSeasonalViewingStats).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account seasonal viewing statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get seasonal viewing stats');
      (accountStatisticsService.getAccountSeasonalViewingStats as jest.Mock).mockRejectedValue(error);

      await getAccountSeasonalViewingStats(req, res, next);

      expect(accountStatisticsService.getAccountSeasonalViewingStats).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccountMilestoneStats', () => {
    it('should return account milestone statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        milestones: [
          { type: '100_episodes', achievedAt: '2024-01-15' },
          { type: '50_movies', achievedAt: '2024-02-20' },
        ],
        nextMilestone: { type: '200_episodes', progress: 75 },
      };

      (accountStatisticsService.getAccountMilestoneStats as jest.Mock).mockResolvedValue(mockStats);

      await getAccountMilestoneStats(req, res, next);

      expect(accountStatisticsService.getAccountMilestoneStats).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account milestone statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get milestone stats');
      (accountStatisticsService.getAccountMilestoneStats as jest.Mock).mockRejectedValue(error);

      await getAccountMilestoneStats(req, res, next);

      expect(accountStatisticsService.getAccountMilestoneStats).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccountContentDepthStats', () => {
    it('should return account content depth statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        showsWithMultipleSeasons: 10,
        averageSeasonsPerShow: 3.5,
        mostWatchedShow: { showId: 1, seasonCount: 8 },
      };

      (accountStatisticsService.getAccountContentDepthStats as jest.Mock).mockResolvedValue(mockStats);

      await getAccountContentDepthStats(req, res, next);

      expect(accountStatisticsService.getAccountContentDepthStats).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account content depth statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get content depth stats');
      (accountStatisticsService.getAccountContentDepthStats as jest.Mock).mockRejectedValue(error);

      await getAccountContentDepthStats(req, res, next);

      expect(accountStatisticsService.getAccountContentDepthStats).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccountContentDiscoveryStats', () => {
    it('should return account content discovery statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        newShowsThisMonth: 5,
        newMoviesThisMonth: 8,
        discoveryRate: 0.15,
      };

      (accountStatisticsService.getAccountContentDiscoveryStats as jest.Mock).mockResolvedValue(mockStats);

      await getAccountContentDiscoveryStats(req, res, next);

      expect(accountStatisticsService.getAccountContentDiscoveryStats).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account content discovery statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get content discovery stats');
      (accountStatisticsService.getAccountContentDiscoveryStats as jest.Mock).mockRejectedValue(error);

      await getAccountContentDiscoveryStats(req, res, next);

      expect(accountStatisticsService.getAccountContentDiscoveryStats).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccountAbandonmentRiskStats', () => {
    it('should return account abandonment risk statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        highRiskShows: [
          { showId: 1, riskScore: 0.85 },
          { showId: 2, riskScore: 0.75 },
        ],
        totalAtRisk: 2,
      };

      (accountStatisticsService.getAccountAbandonmentRiskStats as jest.Mock).mockResolvedValue(mockStats);

      await getAccountAbandonmentRiskStats(req, res, next);

      expect(accountStatisticsService.getAccountAbandonmentRiskStats).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account abandonment risk statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get abandonment risk stats');
      (accountStatisticsService.getAccountAbandonmentRiskStats as jest.Mock).mockRejectedValue(error);

      await getAccountAbandonmentRiskStats(req, res, next);

      expect(accountStatisticsService.getAccountAbandonmentRiskStats).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getAccountUnairedContentStats', () => {
    it('should return account unaired content statistics successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        unairedEpisodesCount: 25,
        showsWithUnairedContent: 5,
        nextUpcomingEpisode: { showId: 1, airDate: '2024-03-15' },
      };

      (accountStatisticsService.getAccountUnairedContentStats as jest.Mock).mockResolvedValue(mockStats);

      await getAccountUnairedContentStats(req, res, next);

      expect(accountStatisticsService.getAccountUnairedContentStats).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved account unaired content statistics',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get unaired content stats');
      (accountStatisticsService.getAccountUnairedContentStats as jest.Mock).mockRejectedValue(error);

      await getAccountUnairedContentStats(req, res, next);

      expect(accountStatisticsService.getAccountUnairedContentStats).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getProfileComparison', () => {
    it('should return profile comparison successfully', async () => {
      req.params = { accountId: 1 };
      const mockStats = {
        profiles: [
          { profileId: 1, name: 'Profile A', showCount: 10, movieCount: 15 },
          { profileId: 2, name: 'Profile B', showCount: 8, movieCount: 12 },
        ],
        comparison: {
          mostActiveProfile: 1,
          leastActiveProfile: 2,
        },
      };

      (accountStatisticsService.getProfileComparison as jest.Mock).mockResolvedValue(mockStats);

      await getProfileComparison(req, res, next);

      expect(accountStatisticsService.getProfileComparison).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved profile comparison',
        results: mockStats,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params = { accountId: 1 };
      const error = new Error('Failed to get profile comparison');
      (accountStatisticsService.getProfileComparison as jest.Mock).mockRejectedValue(error);

      await getProfileComparison(req, res, next);

      expect(accountStatisticsService.getProfileComparison).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
