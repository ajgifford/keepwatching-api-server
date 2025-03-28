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

    it('should update season status from WATCHED to WATCHING', async () => {
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
  });
});
