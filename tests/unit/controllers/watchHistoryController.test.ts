import { watchHistoryService } from '@ajgifford/keepwatching-common-server/services';
import {
  dismissBulkMarkedShow,
  getBulkMarkedShows,
  getWatchHistory,
  recordEpisodeRewatch,
  retroactivelyMarkShowAsPrior,
  startMovieRewatch,
  startSeasonRewatch,
  startShowRewatch,
} from '@controllers/watchHistoryController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  watchHistoryService: {
    getBulkMarkedShows: jest.fn(),
    dismissBulkMarkedShow: jest.fn(),
    retroactivelyMarkShowAsPrior: jest.fn(),
    startShowRewatch: jest.fn(),
    startSeasonRewatch: jest.fn(),
    startMovieRewatch: jest.fn(),
    recordEpisodeRewatch: jest.fn(),
    getHistoryForProfile: jest.fn(),
  },
}));

describe('watchHistoryController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { accountId: 1, profileId: 123, showId: 456, seasonId: 789, movieId: 321, episodeId: 654 },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getBulkMarkedShows', () => {
    it('should return bulk-marked shows for a profile', async () => {
      const mockShows = [
        { showId: 1, title: 'Show A' },
        { showId: 2, title: 'Show B' },
      ];
      (watchHistoryService.getBulkMarkedShows as jest.Mock).mockResolvedValue(mockShows);

      await getBulkMarkedShows(req, res, next);

      expect(watchHistoryService.getBulkMarkedShows).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved bulk-marked shows',
        shows: mockShows,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to get bulk-marked shows');
      (watchHistoryService.getBulkMarkedShows as jest.Mock).mockRejectedValue(error);

      await getBulkMarkedShows(req, res, next);

      expect(watchHistoryService.getBulkMarkedShows).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('dismissBulkMarkedShow', () => {
    it('should dismiss a bulk-marked show', async () => {
      req.body = { showId: 456 };
      (watchHistoryService.dismissBulkMarkedShow as jest.Mock).mockResolvedValue(undefined);

      await dismissBulkMarkedShow(req, res, next);

      expect(watchHistoryService.dismissBulkMarkedShow).toHaveBeenCalledWith(123, 456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully dismissed show from watch history review',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.body = { showId: 456 };
      const error = new Error('Failed to dismiss show');
      (watchHistoryService.dismissBulkMarkedShow as jest.Mock).mockRejectedValue(error);

      await dismissBulkMarkedShow(req, res, next);

      expect(watchHistoryService.dismissBulkMarkedShow).toHaveBeenCalledWith(123, 456);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('retroactivelyMarkShowAsPrior', () => {
    it('should retroactively mark show episodes as prior-watched', async () => {
      req.body = { showId: 456, seasonIds: [1, 2, 3] };
      (watchHistoryService.retroactivelyMarkShowAsPrior as jest.Mock).mockResolvedValue(undefined);

      await retroactivelyMarkShowAsPrior(req, res, next);

      expect(watchHistoryService.retroactivelyMarkShowAsPrior).toHaveBeenCalledWith(1, 123, 456, [1, 2, 3]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully marked show episodes as previously watched',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.body = { showId: 456, seasonIds: [1, 2] };
      const error = new Error('Failed to mark show as prior');
      (watchHistoryService.retroactivelyMarkShowAsPrior as jest.Mock).mockRejectedValue(error);

      await retroactivelyMarkShowAsPrior(req, res, next);

      expect(watchHistoryService.retroactivelyMarkShowAsPrior).toHaveBeenCalledWith(1, 123, 456, [1, 2]);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('startShowRewatch', () => {
    it('should start a show rewatch', async () => {
      const mockStatusData = { showId: 456, watchStatus: 'NOT_WATCHED', rewatchCount: 1 };
      (watchHistoryService.startShowRewatch as jest.Mock).mockResolvedValue(mockStatusData);

      await startShowRewatch(req, res, next);

      expect(watchHistoryService.startShowRewatch).toHaveBeenCalledWith(1, 123, 456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully started show rewatch',
        statusData: mockStatusData,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to start show rewatch');
      (watchHistoryService.startShowRewatch as jest.Mock).mockRejectedValue(error);

      await startShowRewatch(req, res, next);

      expect(watchHistoryService.startShowRewatch).toHaveBeenCalledWith(1, 123, 456);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('startSeasonRewatch', () => {
    it('should start a season rewatch', async () => {
      const mockStatusData = { seasonId: 789, watchStatus: 'NOT_WATCHED', rewatchCount: 2 };
      (watchHistoryService.startSeasonRewatch as jest.Mock).mockResolvedValue(mockStatusData);

      await startSeasonRewatch(req, res, next);

      expect(watchHistoryService.startSeasonRewatch).toHaveBeenCalledWith(1, 123, 789);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully started season rewatch',
        statusData: mockStatusData,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to start season rewatch');
      (watchHistoryService.startSeasonRewatch as jest.Mock).mockRejectedValue(error);

      await startSeasonRewatch(req, res, next);

      expect(watchHistoryService.startSeasonRewatch).toHaveBeenCalledWith(1, 123, 789);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('startMovieRewatch', () => {
    it('should start a movie rewatch', async () => {
      const mockMovie = { movieId: 321, title: 'The Matrix', rewatchCount: 3 };
      (watchHistoryService.startMovieRewatch as jest.Mock).mockResolvedValue(mockMovie);

      await startMovieRewatch(req, res, next);

      expect(watchHistoryService.startMovieRewatch).toHaveBeenCalledWith(1, 123, 321);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully started movie rewatch',
        movie: mockMovie,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to start movie rewatch');
      (watchHistoryService.startMovieRewatch as jest.Mock).mockRejectedValue(error);

      await startMovieRewatch(req, res, next);

      expect(watchHistoryService.startMovieRewatch).toHaveBeenCalledWith(1, 123, 321);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('recordEpisodeRewatch', () => {
    it('should record a casual episode rewatch', async () => {
      const mockResult = { rewatchCount: 1, watchedAt: '2026-04-03T12:00:00Z' };
      (watchHistoryService.recordEpisodeRewatch as jest.Mock).mockResolvedValue(mockResult);

      await recordEpisodeRewatch(req, res, next);

      expect(watchHistoryService.recordEpisodeRewatch).toHaveBeenCalledWith(1, 123, 654);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully recorded episode rewatch',
        ...mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to record episode rewatch');
      (watchHistoryService.recordEpisodeRewatch as jest.Mock).mockRejectedValue(error);

      await recordEpisodeRewatch(req, res, next);

      expect(watchHistoryService.recordEpisodeRewatch).toHaveBeenCalledWith(1, 123, 654);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getWatchHistory', () => {
    it('should retrieve paginated watch history with default query params', async () => {
      req.query = { page: 1, pageSize: 20, contentType: 'all', sortOrder: 'desc' };
      const mockHistory = {
        items: [{ id: 1, title: 'Episode 1', watchedAt: '2026-04-01' }],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      (watchHistoryService.getHistoryForProfile as jest.Mock).mockResolvedValue(mockHistory);

      await getWatchHistory(req, res, next);

      expect(watchHistoryService.getHistoryForProfile).toHaveBeenCalledWith(
        123,
        1,
        20,
        'all',
        'desc',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved watch history',
        ...mockHistory,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass all optional query params to the service', async () => {
      req.query = {
        page: 2,
        pageSize: 10,
        contentType: 'show',
        sortOrder: 'asc',
        dateFrom: '2026-01-01',
        dateTo: '2026-03-31',
        isPriorWatchOnly: true,
        excludePriorWatch: false,
        searchQuery: 'Breaking Bad',
      };
      const mockHistory = { items: [], total: 0, page: 2, pageSize: 10 };
      (watchHistoryService.getHistoryForProfile as jest.Mock).mockResolvedValue(mockHistory);

      await getWatchHistory(req, res, next);

      expect(watchHistoryService.getHistoryForProfile).toHaveBeenCalledWith(
        123,
        2,
        10,
        'show',
        'asc',
        '2026-01-01',
        '2026-03-31',
        true,
        'Breaking Bad',
        false,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.query = { page: 1, pageSize: 20 };
      const error = new Error('Failed to retrieve watch history');
      (watchHistoryService.getHistoryForProfile as jest.Mock).mockRejectedValue(error);

      await getWatchHistory(req, res, next);

      expect(watchHistoryService.getHistoryForProfile).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
