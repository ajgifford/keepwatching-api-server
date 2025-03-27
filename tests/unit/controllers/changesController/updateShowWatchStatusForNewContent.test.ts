import { updateShowWatchStatusForNewContent } from '@controllers/changesController';
import { cliLogger } from '@logger/logger';
import Show from '@models/show';
import { getDbPool } from '@utils/db';
import { RowDataPacket } from 'mysql2';

jest.mock('@models/show');
jest.mock('@utils/db');
jest.mock('@logger/logger', () => ({
  cliLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('updateShowWatchStatusForNewContent', () => {
  const mockExecute = jest.fn();
  const mockRelease = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (getDbPool as jest.Mock).mockReturnValue({
      execute: mockExecute,
    });
  });

  test('should update show status from WATCHED to WATCHING for profiles with new content', async () => {
    mockExecute.mockResolvedValue([[{ status: 'WATCHED' }] as RowDataPacket[]]);

    await updateShowWatchStatusForNewContent(123, [1, 2]);

    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(mockExecute).toHaveBeenCalledWith(
      'SELECT status FROM show_watch_status WHERE profile_id = ? AND show_id = ?',
      [1, 123],
    );
    expect(mockExecute).toHaveBeenCalledWith(
      'SELECT status FROM show_watch_status WHERE profile_id = ? AND show_id = ?',
      [2, 123],
    );
    expect(Show.updateWatchStatus).toHaveBeenCalledTimes(2);
    expect(Show.updateWatchStatus).toHaveBeenCalledWith('1', 123, 'WATCHING');
    expect(Show.updateWatchStatus).toHaveBeenCalledWith('2', 123, 'WATCHING');
  });

  test('should not update show status if already set to something other than WATCHED', async () => {
    mockExecute.mockResolvedValueOnce([[{ status: 'WATCHING' }] as RowDataPacket[]]); // First profile
    mockExecute.mockResolvedValueOnce([[{ status: 'NOT_WATCHED' }] as RowDataPacket[]]); // Second profile

    await updateShowWatchStatusForNewContent(123, [1, 2]);

    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(Show.updateWatchStatus).not.toHaveBeenCalled();
  });

  test('should do nothing if profile has no watch status record', async () => {
    mockExecute.mockResolvedValue([[]]);

    await updateShowWatchStatusForNewContent(123, [1]);

    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(Show.updateWatchStatus).not.toHaveBeenCalled();
  });

  test('should handle database error gracefully', async () => {
    const dbError = new Error('Database error');
    mockExecute.mockRejectedValue(dbError);

    await updateShowWatchStatusForNewContent(123, [1]);

    expect(cliLogger.error).toHaveBeenCalledWith('Error updating show watch status for new content', dbError);
  });

  test('should handle empty profile list', async () => {
    await updateShowWatchStatusForNewContent(123, []);

    expect(mockExecute).not.toHaveBeenCalled();
    expect(Show.updateWatchStatus).not.toHaveBeenCalled();
  });

  test('should process multiple profiles with mixed statuses', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ status: 'WATCHED' }] as RowDataPacket[]])
      .mockResolvedValueOnce([[{ status: 'WATCHING' }] as RowDataPacket[]])
      .mockResolvedValueOnce([[{ status: 'WATCHED' }] as RowDataPacket[]])
      .mockResolvedValueOnce([[] as RowDataPacket[]]);

    await updateShowWatchStatusForNewContent(123, [1, 2, 3, 4]);

    expect(mockExecute).toHaveBeenCalledTimes(4);
    expect(Show.updateWatchStatus).toHaveBeenCalledTimes(2);
    expect(Show.updateWatchStatus).toHaveBeenCalledWith('1', 123, 'WATCHING');
    expect(Show.updateWatchStatus).toHaveBeenCalledWith('3', 123, 'WATCHING');
  });
});
