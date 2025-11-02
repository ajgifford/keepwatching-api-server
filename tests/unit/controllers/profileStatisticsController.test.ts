import { profileStatisticsService } from '@ajgifford/keepwatching-common-server/testing';
import { getProfileStatistics } from '@controllers/profileStatisticsController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({ profileStatisticsService }));

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
});
