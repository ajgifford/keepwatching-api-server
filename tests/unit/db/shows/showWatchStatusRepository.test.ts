import * as showsDb from '@db/showsDb';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

jest.mock('@utils/db', () => {
  const mockPool = {
    execute: jest.fn(),
    getConnection: jest.fn(),
  };
  return {
    getDbPool: jest.fn(() => mockPool),
  };
});

describe('showWatchStatusRepository', () => {
  let mockPool: any;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };

    mockPool = getDbPool();
    mockPool.execute.mockReset();
    mockPool.getConnection.mockReset();
    mockPool.getConnection.mockResolvedValue(mockConnection);
  });

  describe('saveFavorite()', () => {
    it('should add show to profile favorites', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]) // Insert show_watch_status
        .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }] as RowDataPacket[]]) // Get seasons
        .mockResolvedValueOnce([{ affectedRows: 2 } as ResultSetHeader]) // Batch insert seasons
        .mockResolvedValueOnce([{ affectedRows: 10 } as ResultSetHeader]); // Batch insert episodes

      await showsDb.saveFavorite('123', 12345, true);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledTimes(4);
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });

  describe('removeFavorite()', () => {
    it('should remove show and related content from profile favorites', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }] as RowDataPacket[]]) // Get seasons
        .mockResolvedValueOnce([{ affectedRows: 10 } as ResultSetHeader]) // Delete episode watch statuses
        .mockResolvedValueOnce([{ affectedRows: 2 } as ResultSetHeader]) // Delete season watch statuses
        .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]); // Delete show watch status

      await showsDb.removeFavorite('123', 12345);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledTimes(4);
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });

  describe('updateWatchStatus', () => {
    it('should update show watch status', async () => {
      mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]);
      const result = await showsDb.updateWatchStatus('123', 5, 'WATCHED');
      expect(mockPool.execute).toHaveBeenCalledWith(
        'UPDATE show_watch_status SET status = ? WHERE profile_id = ? AND show_id = ?',
        ['WATCHED', '123', 5],
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      mockPool.execute.mockResolvedValueOnce([{ affectedRows: 0 } as ResultSetHeader]);
      const result = await showsDb.updateWatchStatus('123', 999, 'WATCHED');
      expect(result).toBe(false);
    });
  });

  describe('updateWatchStatusBySeason', () => {
    it('should update the watch status of a show based on the status of its seasons', () => {});
  });

  describe('updateAllWatchStatuses', () => {
    it('should update the watch status of a show and its children', () => {});
  });

  describe('getWatchStatus', () => {
    it('should return the current watch status of a show for a profile', () => {});
  });
});
