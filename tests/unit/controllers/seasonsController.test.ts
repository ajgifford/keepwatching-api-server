import { seasonsService, watchHistoryService } from '@ajgifford/keepwatching-common-server/services';
import { getSeasonsForShow, markSeasonIdsAsPriorWatched, updateSeasonWatchStatus } from '@controllers/seasonsController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  seasonsService: {
    updateSeasonWatchStatus: jest.fn(),
    getSeasonsForShow: jest.fn(),
  },
  watchHistoryService: {
    markSeasonIdsAsPriorWatched: jest.fn(),
  },
}));

describe('seasonsController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { accountId: 1, profileId: 123 },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('updateSeasonWatchStatus', () => {
    it('should update season watch status successfully', async () => {
      req.body = { seasonId: 456, status: 'WATCHED', recursive: false };
      const mockResult = { nextUnwatchedEpisodes: [{ id: 789, title: 'Next Episode' }] };
      (seasonsService.updateSeasonWatchStatus as jest.Mock).mockResolvedValue(mockResult);

      await updateSeasonWatchStatus(req, res, next);

      expect(seasonsService.updateSeasonWatchStatus).toHaveBeenCalledWith(1, 123, 456, 'WATCHED');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully updated the season watch status',
        statusData: mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.body = { seasonId: 456, status: 'WATCHED' };
      const error = new Error('Failed to update status');
      (seasonsService.updateSeasonWatchStatus as jest.Mock).mockRejectedValue(error);

      await updateSeasonWatchStatus(req, res, next);

      expect(seasonsService.updateSeasonWatchStatus).toHaveBeenCalledWith(1, 123, 456, 'WATCHED');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getSeasonsForShow', () => {
    it('should retrieve seasons for a show successfully', async () => {
      req.params.showId = '200';
      const mockSeasons = [
        { season_id: 1, name: 'Season 1', episodes: [{ episode_id: 101 }, { episode_id: 102 }] },
        { season_id: 2, name: 'Season 2', episodes: [{ episode_id: 201 }] },
      ];
      (seasonsService.getSeasonsForShow as jest.Mock).mockResolvedValue(mockSeasons);

      await getSeasonsForShow(req, res, next);

      expect(seasonsService.getSeasonsForShow).toHaveBeenCalledWith(123, '200');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved seasons for the show',
        results: mockSeasons,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params.showId = '200';
      const error = new Error('Failed to get seasons');
      (seasonsService.getSeasonsForShow as jest.Mock).mockRejectedValue(error);

      await getSeasonsForShow(req, res, next);

      expect(seasonsService.getSeasonsForShow).toHaveBeenCalledWith(123, '200');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('markSeasonIdsAsPriorWatched', () => {
    it('should mark specific seasons as previously watched', async () => {
      req.body = { seasonIds: [1, 2, 3], showId: 456 };
      const mockResult = { updatedEpisodes: 30 };
      (watchHistoryService.markSeasonIdsAsPriorWatched as jest.Mock).mockResolvedValue(mockResult);

      await markSeasonIdsAsPriorWatched(req, res, next);

      expect(watchHistoryService.markSeasonIdsAsPriorWatched).toHaveBeenCalledWith(1, 123, 456, [1, 2, 3]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully marked seasons as previously watched',
        statusData: mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.body = { seasonIds: [1, 2, 3], showId: 456 };
      const error = new Error('Failed to mark seasons as prior watched');
      (watchHistoryService.markSeasonIdsAsPriorWatched as jest.Mock).mockRejectedValue(error);

      await markSeasonIdsAsPriorWatched(req, res, next);

      expect(watchHistoryService.markSeasonIdsAsPriorWatched).toHaveBeenCalledWith(1, 123, 456, [1, 2, 3]);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
