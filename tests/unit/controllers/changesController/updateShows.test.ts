import { ContentUpdates } from '../../../src/types/contentTypes';
import { checkForShowChanges, updateShows } from '@controllers/changesController';
import { cliLogger, httpLogger } from '@logger/logger';
import { ErrorMessages } from '@logger/loggerModel';
import Show from '@models/show';

// Mock dependencies
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

// Mock global.setTimeout
jest.mock('timers', () => ({
  setTimeout: (callback: Function) => callback(),
}));

describe('updateShows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should process all shows that need updates', async () => {
    // Mock shows data
    const mockShows: ContentUpdates[] = [
      { id: 1, title: 'Show 1', tmdb_id: 101, created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: 2, title: 'Show 2', tmdb_id: 102, created_at: '2023-01-01', updated_at: '2023-01-01' },
    ];

    // Setup mocks
    (Show.getShowsForUpdates as jest.Mock).mockResolvedValue(mockShows);

    // Call the function being tested
    await updateShows();

    // Verify logger was called with correct message
    expect(cliLogger.info).toHaveBeenCalledWith('Found 2 shows to check for updates');

    // Verify checkForShowChanges was called for each show
    expect(checkForShowChanges).toHaveBeenCalledTimes(2);
    expect(checkForShowChanges).toHaveBeenCalledWith(mockShows[0]);
    expect(checkForShowChanges).toHaveBeenCalledWith(mockShows[1]);
  });

  test('should handle empty shows list', async () => {
    // Mock empty shows data
    (Show.getShowsForUpdates as jest.Mock).mockResolvedValue([]);

    // Call the function being tested
    await updateShows();

    // Verify logger was called with correct message
    expect(cliLogger.info).toHaveBeenCalledWith('Found 0 shows to check for updates');

    // Verify checkForShowChanges was not called
    expect(checkForShowChanges).not.toHaveBeenCalled();
  });

  test('should continue processing even if one show update fails', async () => {
    // Mock shows data
    const mockShows: ContentUpdates[] = [
      { id: 1, title: 'Show 1', tmdb_id: 101, created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: 2, title: 'Show 2', tmdb_id: 102, created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: 3, title: 'Show 3', tmdb_id: 103, created_at: '2023-01-01', updated_at: '2023-01-01' },
    ];

    // Setup mocks
    (Show.getShowsForUpdates as jest.Mock).mockResolvedValue(mockShows);

    // Make the second show fail
    (checkForShowChanges as jest.Mock)
      .mockResolvedValueOnce(undefined) // First show succeeds
      .mockRejectedValueOnce(new Error('Show update failed')) // Second show fails
      .mockResolvedValueOnce(undefined); // Third show succeeds

    // Call the function being tested
    await updateShows();

    // Verify all shows were processed
    expect(checkForShowChanges).toHaveBeenCalledTimes(3);

    // Verify error was logged for the failed show
    expect(cliLogger.error).toHaveBeenCalledWith('Failed to check for changes in show ID 2', expect.any(Error));
  });

  test('should handle global error in getShowsForUpdates', async () => {
    // Setup mock to throw error
    const mockError = new Error('Database error');
    (Show.getShowsForUpdates as jest.Mock).mockRejectedValue(mockError);

    // Call the function being tested and expect it to throw
    await expect(updateShows()).rejects.toThrow('Database error');

    // Verify error was logged
    expect(cliLogger.error).toHaveBeenCalledWith('Unexpected error while checking for show updates', mockError);
    expect(httpLogger.error).toHaveBeenCalledWith(ErrorMessages.ShowsChangeFail, { error: mockError });
  });

  test('should handle rate limiting between requests', async () => {
    // Mock shows data
    const mockShows: ContentUpdates[] = [
      { id: 1, title: 'Show 1', tmdb_id: 101, created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: 2, title: 'Show 2', tmdb_id: 102, created_at: '2023-01-01', updated_at: '2023-01-01' },
    ];

    // Setup mocks
    (Show.getShowsForUpdates as jest.Mock).mockResolvedValue(mockShows);

    // Spy on setTimeout
    const sleepSpy = jest.spyOn(global, 'setTimeout');

    // Call the function being tested
    await updateShows();

    // Verify setTimeout was called for rate limiting
    expect(sleepSpy).toHaveBeenCalledTimes(2); // Once per show
    expect(sleepSpy).toHaveBeenCalledWith(expect.any(Function), 500);
  });
});
