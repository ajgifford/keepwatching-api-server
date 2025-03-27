import { initScheduledJobs, updateMovies, updateShows } from '@controllers/changesController';
import { cliLogger } from '@logger/logger';
import CronJob from 'node-cron';

// Mock dependencies
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

jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({
    start: jest.fn(),
  }),
}));

// Mock the update functions that are called by the scheduled jobs
jest.mock('@controllers/changesController', () => {
  const originalModule = jest.requireActual('@controllers/changesController');
  return {
    ...originalModule,
    updateShows: jest.fn().mockResolvedValue(undefined),
    updateMovies: jest.fn().mockResolvedValue(undefined),
    // We expose the real initScheduledJobs to test
    initScheduledJobs: originalModule.initScheduledJobs,
  };
});

describe('initScheduledJobs', () => {
  let mockNotifyShowUpdates: jest.Mock;
  let mockNotifyMovieUpdates: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create mock callback functions
    mockNotifyShowUpdates = jest.fn();
    mockNotifyMovieUpdates = jest.fn();
  });

  test('should initialize scheduled jobs with correct patterns', () => {
    // Call the function being tested
    initScheduledJobs(mockNotifyShowUpdates, mockNotifyMovieUpdates);

    // Verify that CronJob.schedule was called twice with correct patterns
    expect(CronJob.schedule).toHaveBeenCalledTimes(2);
    expect(CronJob.schedule).toHaveBeenCalledWith('0 2 * * *', expect.any(Function));
    expect(CronJob.schedule).toHaveBeenCalledWith('0 1 7,14,21,28 * *', expect.any(Function));

    // Verify that both returned jobs are started
    expect(CronJob.schedule('0 2 * * *', expect.any(Function)).start).toHaveBeenCalled();
    expect(CronJob.schedule('0 1 7,14,21,28 * *', expect.any(Function)).start).toHaveBeenCalled();

    // Verify that logger was called
    expect(cliLogger.info).toHaveBeenCalledWith('Job Scheduler Initialized');
  });

  test('should execute show updates job and call notification callback', async () => {
    // Setup and arrange test
    const mockSchedule = CronJob.schedule as jest.Mock;

    // Call the function being tested
    initScheduledJobs(mockNotifyShowUpdates, mockNotifyMovieUpdates);

    // Extract the job callback for shows
    const showJobCallback = mockSchedule.mock.calls[0][1];

    // Execute the job callback
    await showJobCallback();

    // Verify that the update function was called
    expect(updateShows).toHaveBeenCalled();

    // Verify that the notification callback was called
    expect(mockNotifyShowUpdates).toHaveBeenCalled();

    // Verify logging
    expect(cliLogger.info).toHaveBeenCalledWith('Starting the show change job');
    expect(cliLogger.info).toHaveBeenCalledWith('Ending the show change job');
  });

  test('should execute movie updates job and call notification callback', async () => {
    // Setup and arrange test
    const mockSchedule = CronJob.schedule as jest.Mock;

    // Call the function being tested
    initScheduledJobs(mockNotifyShowUpdates, mockNotifyMovieUpdates);

    // Extract the job callback for movies
    const movieJobCallback = mockSchedule.mock.calls[1][1];

    // Execute the job callback
    await movieJobCallback();

    // Verify that the update function was called
    expect(updateMovies).toHaveBeenCalled();

    // Verify that the notification callback was called
    expect(mockNotifyMovieUpdates).toHaveBeenCalled();

    // Verify logging
    expect(cliLogger.info).toHaveBeenCalledWith('Starting the movie change job');
    expect(cliLogger.info).toHaveBeenCalledWith('Ending the movie change job');
  });

  test('should handle errors in show updates', async () => {
    // Setup for error case
    const mockSchedule = CronJob.schedule as jest.Mock;
    (updateShows as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    // Call the function being tested
    initScheduledJobs(mockNotifyShowUpdates, mockNotifyMovieUpdates);

    // Extract the job callback for shows
    const showJobCallback = mockSchedule.mock.calls[0][1];

    // Execute the job callback
    await showJobCallback();

    // Verify that the update function was called
    expect(updateShows).toHaveBeenCalled();

    // Verify that error was logged
    expect(cliLogger.error).toHaveBeenCalledWith('Failed to complete show update job', expect.any(Error));

    // Verify that the job still completes
    expect(cliLogger.info).toHaveBeenCalledWith('Ending the show change job');

    // Verify that notification callback was not called due to error
    expect(mockNotifyShowUpdates).not.toHaveBeenCalled();
  });

  test('should handle errors in movie updates', async () => {
    // Setup for error case
    const mockSchedule = CronJob.schedule as jest.Mock;
    (updateMovies as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    // Call the function being tested
    initScheduledJobs(mockNotifyShowUpdates, mockNotifyMovieUpdates);

    // Extract the job callback for movies
    const movieJobCallback = mockSchedule.mock.calls[1][1];

    // Execute the job callback
    await movieJobCallback();

    // Verify that the update function was called
    expect(updateMovies).toHaveBeenCalled();

    // Verify that error was logged
    expect(cliLogger.error).toHaveBeenCalledWith('Failed to complete movie update job', expect.any(Error));

    // Verify that the job still completes
    expect(cliLogger.info).toHaveBeenCalledWith('Ending the movie change job');

    // Verify that notification callback was not called due to error
    expect(mockNotifyMovieUpdates).not.toHaveBeenCalled();
  });
});
