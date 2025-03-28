import Show from '@models/show';
import { showService } from '@services/showService';
import { RowDataPacket } from 'mysql2';

jest.mock('@models/show');
jest.mock('@utils/db');

describe('showService', () => {
  describe('updateShowWatchStatusForNewContent', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update show status from WATCHED to WATCHING for profiles with new content', async () => {
      (Show.getWatchStatus as jest.Mock).mockResolvedValue('WATCHED');

      await showService.updateShowWatchStatusForNewContent(123, [1, 2]);

      expect(Show.getWatchStatus).toHaveBeenCalledTimes(2);
      expect(Show.updateWatchStatus).toHaveBeenCalledTimes(2);
      expect(Show.updateWatchStatus).toHaveBeenCalledWith('1', 123, 'WATCHING');
      expect(Show.updateWatchStatus).toHaveBeenCalledWith('2', 123, 'WATCHING');
    });

    it('should not update show status if already set to something other than WATCHED', async () => {
      (Show.getWatchStatus as jest.Mock).mockResolvedValueOnce('WATCHING');
      (Show.getWatchStatus as jest.Mock).mockResolvedValueOnce('NOT_WATCHED');

      await showService.updateShowWatchStatusForNewContent(123, [1, 2]);

      expect(Show.getWatchStatus).toHaveBeenCalledTimes(2);
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should do nothing if profile has no watch status record', async () => {
      (Show.getWatchStatus as jest.Mock).mockResolvedValue(null);

      await showService.updateShowWatchStatusForNewContent(123, [1]);

      expect(Show.getWatchStatus).toHaveBeenCalledTimes(1);
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should handle empty profile list', async () => {
      await showService.updateShowWatchStatusForNewContent(123, []);

      expect(Show.getWatchStatus).not.toHaveBeenCalled();
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should process multiple profiles with mixed statuses', async () => {
      (Show.getWatchStatus as jest.Mock).mockResolvedValueOnce('WATCHED');
      (Show.getWatchStatus as jest.Mock).mockResolvedValueOnce('WATCHING');
      (Show.getWatchStatus as jest.Mock).mockResolvedValueOnce('WATCHED');
      (Show.getWatchStatus as jest.Mock).mockResolvedValueOnce(null);

      await showService.updateShowWatchStatusForNewContent(123, [1, 2, 3, 4]);

      expect(Show.getWatchStatus).toHaveBeenCalledTimes(4);
      expect(Show.updateWatchStatus).toHaveBeenCalledTimes(2);
      expect(Show.updateWatchStatus).toHaveBeenCalledWith('1', 123, 'WATCHING');
      expect(Show.updateWatchStatus).toHaveBeenCalledWith('3', 123, 'WATCHING');
    });
  });
});
