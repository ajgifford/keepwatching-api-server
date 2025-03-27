import { ContentUpdates } from '../../../../src/types/contentTypes';
import { checkForShowChanges, updateShows } from '@controllers/changesController';
import { cliLogger, httpLogger } from '@logger/logger';
import { ErrorMessages } from '@logger/loggerModel';
import Show from '@models/show';

jest.mock('@models/show');
jest.mock('@logger/logger', () => ({
  cliLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  httpLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('@logger/loggerModel', () => ({
  ErrorMessages: {
    ShowsChangeFail: 'Unexpected error while updating shows',
  },
}));
jest.mock('@controllers/changesController', () => {
  const originalModule = jest.requireActual('@controllers/changesController');
  return {
    ...originalModule,
    checkForShowChanges: jest.fn().mockResolvedValue(undefined),
  };
});
jest.mock('timers', () => ({
  setTimeout: (callback: Function) => callback(),
}));

describe('updateShows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should process all shows that need updates', async () => {
    const mockShows: ContentUpdates[] = [
      { id: 1, title: 'Show 1', tmdb_id: 101, created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: 2, title: 'Show 2', tmdb_id: 102, created_at: '2023-01-01', updated_at: '2023-01-01' },
    ];

    (Show.getShowsForUpdates as jest.Mock).mockResolvedValue(mockShows);

    await updateShows();

    expect(cliLogger.info).toHaveBeenCalledWith('Found 2 shows to check for updates');
  });

  test('should handle empty shows list', async () => {
    (Show.getShowsForUpdates as jest.Mock).mockResolvedValue([]);

    await updateShows();

    expect(cliLogger.info).toHaveBeenCalledWith('Found 0 shows to check for updates');
    expect(checkForShowChanges).not.toHaveBeenCalled();
  });

  test('should continue processing even if one show update fails', async () => {
    const mockShows: ContentUpdates[] = [
      { id: 1, title: 'Show 1', tmdb_id: 101, created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: 2, title: 'Show 2', tmdb_id: 102, created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: 3, title: 'Show 3', tmdb_id: 103, created_at: '2023-01-01', updated_at: '2023-01-01' },
    ];

    (Show.getShowsForUpdates as jest.Mock).mockResolvedValue(mockShows);

    (checkForShowChanges as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Show update failed'))
      .mockResolvedValueOnce(undefined);

    await updateShows();

    expect(cliLogger.error).toHaveBeenCalledWith('Failed to check for changes in show ID 2', expect.any(Error));
  });

  test('should handle global error in getShowsForUpdates', async () => {
    const mockError = new Error('Database error');
    (Show.getShowsForUpdates as jest.Mock).mockRejectedValue(mockError);

    await expect(updateShows()).rejects.toThrow('Database error');

    expect(cliLogger.error).toHaveBeenCalledWith('Unexpected error while checking for show updates', mockError);
    expect(httpLogger.error).toHaveBeenCalledWith(ErrorMessages.ShowsChangeFail, { error: mockError });
  });

  test('should handle rate limiting between requests', async () => {
    const mockShows: ContentUpdates[] = [
      { id: 1, title: 'Show 1', tmdb_id: 101, created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: 2, title: 'Show 2', tmdb_id: 102, created_at: '2023-01-01', updated_at: '2023-01-01' },
    ];

    (Show.getShowsForUpdates as jest.Mock).mockResolvedValue(mockShows);

    const sleepSpy = jest.spyOn(global, 'setTimeout');

    await updateShows();

    expect(sleepSpy).toHaveBeenCalledTimes(4);
    expect(sleepSpy).toHaveBeenCalledWith(expect.any(Function), 500);
  });
});
