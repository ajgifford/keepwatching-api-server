import { BadRequestError } from '@middleware/errorMiddleware';
import Season from '@models/season';
import Show from '@models/show';
import { errorService } from '@services/errorService';
import { seasonsService } from '@services/seasonsService';
import { showService } from '@services/showService';

jest.mock('@models/season');
jest.mock('@models/show');
jest.mock('@services/errorService');
jest.mock('@services/showService');

describe('seasonsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateSeasonWatchStatus', () => {
    it('should update season watch status without recursion', async () => {
      (Season.updateWatchStatus as jest.Mock).mockResolvedValue(true);
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(123);
      (showService.invalidateProfileCache as jest.Mock).mockImplementation(() => {});

      const result = await seasonsService.updateSeasonWatchStatus('456', 789, 'WATCHED');

      expect(Season.updateWatchStatus).toHaveBeenCalledWith('456', 789, 'WATCHED');
      expect(Season.updateAllWatchStatuses).not.toHaveBeenCalled();
      expect(Season.getShowIdForSeason).toHaveBeenCalledWith(789);
      expect(Show.updateWatchStatusBySeason).toHaveBeenCalledWith('456', 123);
      expect(showService.invalidateProfileCache).toHaveBeenCalledWith('456');
      expect(result).toBe(true);
    });

    it('should update season watch status with recursion', async () => {
      (Season.updateAllWatchStatuses as jest.Mock).mockResolvedValue(true);
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(123);
      (showService.invalidateProfileCache as jest.Mock).mockImplementation(() => {});

      const result = await seasonsService.updateSeasonWatchStatus('456', 789, 'WATCHED', true);

      expect(Season.updateAllWatchStatuses).toHaveBeenCalledWith('456', 789, 'WATCHED');
      expect(Season.updateWatchStatus).not.toHaveBeenCalled();
      expect(Season.getShowIdForSeason).toHaveBeenCalledWith(789);
      expect(Show.updateWatchStatusBySeason).toHaveBeenCalledWith('456', 123);
      expect(showService.invalidateProfileCache).toHaveBeenCalledWith('456');
      expect(result).toBe(true);
    });

    it('should throw BadRequestError when update fails', async () => {
      (Season.updateWatchStatus as jest.Mock).mockResolvedValue(false);
      (errorService.handleError as jest.Mock).mockImplementation((error) => {
        throw error;
      });

      await expect(seasonsService.updateSeasonWatchStatus('456', 789, 'WATCHED')).rejects.toThrow(
        'No season watch status was updated',
      );

      expect(Season.updateWatchStatus).toHaveBeenCalledWith('456', 789, 'WATCHED');
      expect(Season.getShowIdForSeason).not.toHaveBeenCalled();
      expect(Show.updateWatchStatusBySeason).not.toHaveBeenCalled();
      expect(showService.invalidateProfileCache).not.toHaveBeenCalled();
    });

    it('should handle errors when updating season watch status', async () => {
      const mockError = new Error('Update failed');
      (Season.updateWatchStatus as jest.Mock).mockRejectedValue(mockError);
      (errorService.handleError as jest.Mock).mockImplementation((error) => {
        throw new Error(`Handled: ${error.message}`);
      });

      await expect(seasonsService.updateSeasonWatchStatus('456', 789, 'WATCHED')).rejects.toThrow(
        'Handled: Update failed',
      );

      expect(errorService.handleError).toHaveBeenCalledWith(
        mockError,
        'updateSeasonWatchStatus(456, 789, WATCHED, false)',
      );
    });

    it('should handle missing show ID', async () => {
      (Season.updateWatchStatus as jest.Mock).mockResolvedValue(true);
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(null);

      const result = await seasonsService.updateSeasonWatchStatus('456', 789, 'WATCHED');

      expect(Season.updateWatchStatus).toHaveBeenCalledWith('456', 789, 'WATCHED');
      expect(Season.getShowIdForSeason).toHaveBeenCalledWith(789);
      expect(Show.updateWatchStatusBySeason).not.toHaveBeenCalled();
      expect(showService.invalidateProfileCache).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('getSeasonsForShow', () => {
    it('should get seasons for a show', async () => {
      const mockSeasons = [
        { season_id: 1, name: 'Season 1', episodes: [{ episode_id: 101 }, { episode_id: 102 }] },
        { season_id: 2, name: 'Season 2', episodes: [{ episode_id: 201 }] },
      ];

      (Season.getSeasonsForShow as jest.Mock).mockResolvedValue(mockSeasons);

      const result = await seasonsService.getSeasonsForShow('456', '123');

      expect(Season.getSeasonsForShow).toHaveBeenCalledWith('456', '123');
      expect(result).toEqual(mockSeasons);
    });

    it('should handle errors when getting seasons for a show', async () => {
      const mockError = new Error('Database error');
      (Season.getSeasonsForShow as jest.Mock).mockRejectedValue(mockError);
      (errorService.handleError as jest.Mock).mockImplementation((error) => {
        throw new Error(`Handled: ${error.message}`);
      });

      await expect(seasonsService.getSeasonsForShow('456', '123')).rejects.toThrow('Handled: Database error');

      expect(errorService.handleError).toHaveBeenCalledWith(mockError, 'getSeasonsForShow(456, 123)');
    });
  });

  describe('updateSeasonWatchStatusForNewEpisodes', () => {
    it('should update season and show status from WATCHED to WATCHING when new episodes added', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(456);
      (Show.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');

      await seasonsService.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.getWatchStatus).toHaveBeenCalledWith('123', 789);
      expect(Season.updateWatchStatus).toHaveBeenCalledWith('123', 789, 'WATCHING');
      expect(Show.updateWatchStatus).toHaveBeenCalledWith('123', 456, 'WATCHING');
    });

    it('should update only season status when show status is already WATCHING', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(456);
      (Show.getWatchStatus as jest.Mock).mockResolvedValue('WATCHING');

      await seasonsService.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.updateWatchStatus).toHaveBeenCalledWith('123', 789, 'WATCHING');
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should not update season status if already set to something other than WATCHED', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHING');

      await seasonsService.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.getWatchStatus).toHaveBeenCalledWith('123', 789);
      expect(Season.updateWatchStatus).not.toHaveBeenCalled();
      expect(Season.getShowIdForSeason).not.toHaveBeenCalled();
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should do nothing if season has no watch status record', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue(null);

      await seasonsService.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.updateWatchStatus).not.toHaveBeenCalled();
      expect(Season.getShowIdForSeason).not.toHaveBeenCalled();
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should not update show status if season has no associated show', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(null);

      await seasonsService.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.updateWatchStatus).toHaveBeenCalledWith('123', 789, 'WATCHING');
      expect(Season.getShowIdForSeason).toHaveBeenCalledWith(789);
      expect(Show.getWatchStatus).not.toHaveBeenCalled();
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should not update show status if show status is NOT_WATCHED', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(456);
      (Show.getWatchStatus as jest.Mock).mockResolvedValue('NOT_WATCHED');

      await seasonsService.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.updateWatchStatus).toHaveBeenCalledWith('123', 789, 'WATCHING');
      expect(Show.getWatchStatus).toHaveBeenCalledWith('123', 456);
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should handle errors when getting season watch status', async () => {
      const mockError = new Error('Database error');
      (Season.getWatchStatus as jest.Mock).mockRejectedValue(mockError);
      (errorService.handleError as jest.Mock).mockImplementation((error) => {
        throw error;
      });

      await expect(seasonsService.updateSeasonWatchStatusForNewEpisodes('123', 789)).rejects.toThrow('Database error');

      expect(errorService.handleError).toHaveBeenCalledWith(
        mockError,
        'updateSeasonWatchStatusForNewEpisodes(123, 789)',
      );
      expect(Season.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should handle errors when updating season watch status', async () => {
      const mockError = new Error('Update failed');
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Season.updateWatchStatus as jest.Mock).mockRejectedValue(mockError);
      (errorService.handleError as jest.Mock).mockImplementation((error) => {
        throw error;
      });

      await expect(seasonsService.updateSeasonWatchStatusForNewEpisodes('123', 789)).rejects.toThrow('Update failed');

      expect(errorService.handleError).toHaveBeenCalledWith(
        mockError,
        'updateSeasonWatchStatusForNewEpisodes(123, 789)',
      );
    });

    it('should handle errors when getting show ID', async () => {
      const mockError = new Error('Show ID lookup failed');
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Season.updateWatchStatus as jest.Mock).mockResolvedValue(true);
      (Season.getShowIdForSeason as jest.Mock).mockRejectedValue(mockError);
      (errorService.handleError as jest.Mock).mockImplementation((error) => {
        throw error;
      });

      await expect(seasonsService.updateSeasonWatchStatusForNewEpisodes('123', 789)).rejects.toThrow(
        'Show ID lookup failed',
      );

      expect(errorService.handleError).toHaveBeenCalledWith(
        mockError,
        'updateSeasonWatchStatusForNewEpisodes(123, 789)',
      );
      expect(Show.getWatchStatus).not.toHaveBeenCalled();
    });

    it('should complete season update even if show update fails', async () => {
      const mockError = new Error('Show update failed');
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(456);
      (Show.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Show.updateWatchStatus as jest.Mock).mockRejectedValue(mockError);
      (errorService.handleError as jest.Mock).mockImplementation((error) => {
        throw error;
      });

      await expect(seasonsService.updateSeasonWatchStatusForNewEpisodes('123', 789)).rejects.toThrow(
        'Show update failed',
      );

      expect(Season.updateWatchStatus).toHaveBeenCalledWith('123', 789, 'WATCHING');
      expect(errorService.handleError).toHaveBeenCalledWith(
        mockError,
        'updateSeasonWatchStatusForNewEpisodes(123, 789)',
      );
    });
  });
});
