import {
  getEpisodesForSeason,
  getRecentEpisodes,
  getUpcomingEpisodes,
  updateEpisodeWatchStatus,
  updateNextEpisodeWatchStatus,
} from '@controllers/episodesController';
import { episodesService } from '@services/episodesService';

jest.mock('@services/episodesService');

describe('episodesController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { accountId: '1', profileId: '123' },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('updateEpisodeWatchStatus', () => {
    it('should update an episode watch status successfully', async () => {
      req.body = { episodeId: 456, status: 'WATCHED' };
      const mockResult = { nextUnwatchedEpisodes: [{ id: 789, title: 'Next Episode' }] };
      (episodesService.updateEpisodeWatchStatus as jest.Mock).mockResolvedValue(mockResult);

      await updateEpisodeWatchStatus(req, res, next);
      expect(episodesService.updateEpisodeWatchStatus).toHaveBeenCalledWith('123', 456, 'WATCHED');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully updated the episode watch status',
        result: mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.body = { episodeId: 456, status: 'WATCHED' };
      const error = new Error('Failed to update status');
      (episodesService.updateEpisodeWatchStatus as jest.Mock).mockRejectedValue(error);

      await updateEpisodeWatchStatus(req, res, next);
      expect(episodesService.updateEpisodeWatchStatus).toHaveBeenCalledWith('123', 456, 'WATCHED');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('updateNextEpisodeWatchStatus', () => {
    it('should update a next episode watch status successfully', async () => {
      req.body = { showId: 100, seasonId: 200, episodeId: 456, status: 'WATCHED' };
      const mockResult = { nextUnwatchedEpisodes: [{ id: 789, title: 'Next Episode' }] };
      (episodesService.updateNextEpisodeWatchStatus as jest.Mock).mockResolvedValue(mockResult);

      await updateNextEpisodeWatchStatus(req, res, next);
      expect(episodesService.updateNextEpisodeWatchStatus).toHaveBeenCalledWith('123', 100, 200, 456, 'WATCHED');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully updated the episode watch status',
        result: mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.body = { showId: 100, seasonId: 200, episodeId: 456, status: 'WATCHED' };
      const error = new Error('Failed to update status');
      (episodesService.updateNextEpisodeWatchStatus as jest.Mock).mockRejectedValue(error);

      await updateNextEpisodeWatchStatus(req, res, next);
      expect(episodesService.updateNextEpisodeWatchStatus).toHaveBeenCalledWith('123', 100, 200, 456, 'WATCHED');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getEpisodesForSeason', () => {
    it('should retrieve episodes for a season successfully', async () => {
      req.params.seasonId = '200';
      const mockEpisodes = [
        { id: 1, title: 'Episode 1', watch_status: 'WATCHED' },
        { id: 2, title: 'Episode 2', watch_status: 'NOT_WATCHED' },
      ];
      (episodesService.getEpisodesForSeason as jest.Mock).mockResolvedValue(mockEpisodes);

      await getEpisodesForSeason(req, res, next);
      expect(episodesService.getEpisodesForSeason).toHaveBeenCalledWith('123', 200);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved episodes for the season',
        results: mockEpisodes,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      req.params.seasonId = '200';
      const error = new Error('Failed to get episodes');
      (episodesService.getEpisodesForSeason as jest.Mock).mockRejectedValue(error);

      await getEpisodesForSeason(req, res, next);
      expect(episodesService.getEpisodesForSeason).toHaveBeenCalledWith('123', 200);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getUpcomingEpisodes', () => {
    it('should retrieve upcoming episodes successfully', async () => {
      const mockEpisodes = [
        { id: 1, title: 'Upcoming Episode 1', air_date: '2025-03-30' },
        { id: 2, title: 'Upcoming Episode 2', air_date: '2025-04-01' },
      ];
      (episodesService.getUpcomingEpisodesForProfile as jest.Mock).mockResolvedValue(mockEpisodes);

      await getUpcomingEpisodes(req, res, next);
      expect(episodesService.getUpcomingEpisodesForProfile).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved upcoming episodes',
        results: mockEpisodes,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      const error = new Error('Failed to get upcoming episodes');
      (episodesService.getUpcomingEpisodesForProfile as jest.Mock).mockRejectedValue(error);

      await getUpcomingEpisodes(req, res, next);
      expect(episodesService.getUpcomingEpisodesForProfile).toHaveBeenCalledWith('123');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getRecentEpisodes', () => {
    it('should retrieve recent episodes successfully', async () => {
      const mockEpisodes = [
        { id: 1, title: 'Recent Episode 1', air_date: '2025-03-20' },
        { id: 2, title: 'Recent Episode 2', air_date: '2025-03-22' },
      ];
      (episodesService.getRecentEpisodesForProfile as jest.Mock).mockResolvedValue(mockEpisodes);

      await getRecentEpisodes(req, res, next);
      expect(episodesService.getRecentEpisodesForProfile).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved recent episodes',
        results: mockEpisodes,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors from the service', async () => {
      const error = new Error('Failed to get recent episodes');
      (episodesService.getRecentEpisodesForProfile as jest.Mock).mockRejectedValue(error);

      await getRecentEpisodes(req, res, next);
      expect(episodesService.getRecentEpisodesForProfile).toHaveBeenCalledWith('123');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
