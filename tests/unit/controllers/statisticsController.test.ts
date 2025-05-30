import { statisticsService } from '@ajgifford/keepwatching-common-server/testing';
import { getAccountStatistics, getProfileStatistics } from '@controllers/statisticsController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({ statisticsService: statisticsService }));

describe('statisticsController', () => {
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

  describe('getProfileStatistics', () => {
    it('should return profile statistics successfully', async () => {
      req.params = { accountId: 1, profileId: 123 };
      const mockStats = {
        showStatistics: { total: 10 },
        movieStatistics: { total: 5 },
        episodeWatchProgress: { watchedEpisodes: 50 },
      };

      (statisticsService.getProfileStatistics as jest.Mock).mockResolvedValue(mockStats);

      await getProfileStatistics(req, res, next);

      expect(statisticsService.getProfileStatistics).toHaveBeenCalledWith(123);
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
      (statisticsService.getProfileStatistics as jest.Mock).mockRejectedValue(error);

      await getProfileStatistics(req, res, next);

      expect(statisticsService.getProfileStatistics).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
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

      (statisticsService.getAccountStatistics as jest.Mock).mockResolvedValue(mockStats);

      await getAccountStatistics(req, res, next);

      expect(statisticsService.getAccountStatistics).toHaveBeenCalledWith(1);
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
      (statisticsService.getAccountStatistics as jest.Mock).mockRejectedValue(error);

      await getAccountStatistics(req, res, next);

      expect(statisticsService.getAccountStatistics).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
