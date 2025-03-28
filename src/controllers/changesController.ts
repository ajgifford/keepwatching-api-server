import { cliLogger } from '../logger/logger';
import { updateMovies } from '../services/movieChangesService';
import { updateShows } from '../services/showChangesService';
import CronJob from 'node-cron';

let showUpdatesCallback: (() => void) | null = null;
let movieUpdatesCallback: (() => void) | null = null;

/**
 * Initialize scheduled jobs for content updates
 * @param notifyShowUpdates Callback to notify UI when shows are updated
 * @param notifyMovieUpdates Callback to notify UI when movies are updated
 */
export function initScheduledJobs(notifyShowUpdates: () => void, notifyMovieUpdates: () => void) {
  showUpdatesCallback = notifyShowUpdates;
  movieUpdatesCallback = notifyMovieUpdates;

  // Daily job for show updates (2 AM)
  const showsJob = CronJob.schedule('0 2 * * *', async () => {
    cliLogger.info('Starting the show change job');
    try {
      await updateShows();
      if (showUpdatesCallback) showUpdatesCallback();
    } catch (error) {
      cliLogger.error('Failed to complete show update job', error);
    } finally {
      cliLogger.info('Ending the show change job');
    }
  });

  // Weekly job for movie updates (1 AM on 7th, 14th, 21st, and 28th of each month)
  const moviesJob = CronJob.schedule('0 1 7,14,21,28 * *', async () => {
    cliLogger.info('Starting the movie change job');
    try {
      await updateMovies();
      if (movieUpdatesCallback) movieUpdatesCallback();
    } catch (error) {
      cliLogger.error('Failed to complete movie update job', error);
    } finally {
      cliLogger.info('Ending the movie change job');
    }
  });

  showsJob.start();
  moviesJob.start();
  cliLogger.info('Job Scheduler Initialized');
}
