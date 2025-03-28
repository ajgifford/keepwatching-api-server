import Season from '@models/season';
import Show from '@models/show';
import { errorService } from '@services/errorService';
import { seasonService } from '@services/seasonService';

jest.mock('@models/season');
jest.mock('@models/show');
jest.mock('@services/errorService');

describe('seasonService', () => {
  describe('updateSeasonWatchStatusForNewEpisodes', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update season and show status from WATCHED to WATCHING when new episodes added', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(456);
      (Show.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');

      await seasonService.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.getWatchStatus).toHaveBeenCalledWith('123', 789);
      expect(Season.updateWatchStatus).toHaveBeenCalledWith('123', 789, 'WATCHING');
      expect(Show.updateWatchStatus).toHaveBeenCalledWith('123', 456, 'WATCHING');
    });

    it('should update only season status when show status is already WATCHING', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(456);
      (Show.getWatchStatus as jest.Mock).mockResolvedValue('WATCHING');

      await seasonService.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.updateWatchStatus).toHaveBeenCalledWith('123', 789, 'WATCHING');
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should not update season status if already set to something other than WATCHED', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHING');

      await seasonService.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.getWatchStatus).toHaveBeenCalledWith('123', 789);
      expect(Season.updateWatchStatus).not.toHaveBeenCalled();
      expect(Season.getShowIdForSeason).not.toHaveBeenCalled();
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should do nothing if season has no watch status record', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue(null);

      await seasonService.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.updateWatchStatus).not.toHaveBeenCalled();
      expect(Season.getShowIdForSeason).not.toHaveBeenCalled();
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should not update show status if season has no associated show', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(null);

      await seasonService.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.updateWatchStatus).toHaveBeenCalledWith('123', 789, 'WATCHING');
      expect(Season.getShowIdForSeason).toHaveBeenCalledWith(789);
      expect(Show.getWatchStatus).not.toHaveBeenCalled();
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should not update show status if show status is NOT_WATCHED', async () => {
      (Season.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');
      (Season.getShowIdForSeason as jest.Mock).mockResolvedValue(456);
      (Show.getWatchStatus as jest.Mock).mockResolvedValue('NOT_WATCHED');

      await seasonService.updateSeasonWatchStatusForNewEpisodes('123', 789);

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

      await expect(seasonService.updateSeasonWatchStatusForNewEpisodes('123', 789)).rejects.toThrow('Database error');

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

      await expect(seasonService.updateSeasonWatchStatusForNewEpisodes('123', 789)).rejects.toThrow('Update failed');

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

      await expect(seasonService.updateSeasonWatchStatusForNewEpisodes('123', 789)).rejects.toThrow(
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

      await expect(seasonService.updateSeasonWatchStatusForNewEpisodes('123', 789)).rejects.toThrow(
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
