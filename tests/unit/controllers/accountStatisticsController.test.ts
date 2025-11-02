import { accountStatisticsService } from '@ajgifford/keepwatching-common-server/testing';
import { getAccountStatistics } from '@controllers/accountStatisticsController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({ accountStatisticsService }));

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
});
