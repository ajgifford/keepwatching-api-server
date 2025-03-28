import { initScheduledJobs } from '@controllers/changesController';
import { cliLogger } from '@logger/logger';
import CronJob from 'node-cron';

jest.mock('@logger/logger', () => ({
  cliLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({
    start: jest.fn(),
  }),
}));

describe('initScheduledJobs', () => {
  let mockNotifyShowUpdates: jest.Mock;
  let mockNotifyMovieUpdates: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockNotifyShowUpdates = jest.fn();
    mockNotifyMovieUpdates = jest.fn();
  });

  test('should initialize scheduled jobs with correct patterns', () => {
    initScheduledJobs(mockNotifyShowUpdates, mockNotifyMovieUpdates);

    expect(CronJob.schedule).toHaveBeenCalledTimes(2);
    expect(CronJob.schedule).toHaveBeenCalledWith('0 2 * * *', expect.any(Function));
    expect(CronJob.schedule).toHaveBeenCalledWith('0 1 7,14,21,28 * *', expect.any(Function));

    expect(CronJob.schedule('0 2 * * *', expect.any(Function)).start).toHaveBeenCalled();
    expect(CronJob.schedule('0 1 7,14,21,28 * *', expect.any(Function)).start).toHaveBeenCalled();

    expect(cliLogger.info).toHaveBeenCalledWith('Job Scheduler Initialized');
  });
});
