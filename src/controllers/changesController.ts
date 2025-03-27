import { cliLogger, httpLogger } from '../logger/logger';
import { ErrorMessages } from '../logger/loggerModel';
import Episode from '../models/episode';
import Movie from '../models/movie';
import Season from '../models/season';
import Show from '../models/show';
import { errorService } from '../services/errorService';
import { getTMDBService } from '../services/tmdbService';
import { Change, ChangeItem, ContentUpdates } from '../types/contentTypes';
import { getEpisodeToAirId, getInProduction, getUSMPARating, getUSNetwork, getUSRating } from '../utils/contentUtility';
import { getDbPool } from '../utils/db';
import { getUSWatchProviders } from '../utils/watchProvidersUtility';
import { RowDataPacket } from 'mysql2';
import CronJob from 'node-cron';

/**
 * List of content change keys we want to process
 * Changes with these keys will trigger an update
 */
const SUPPORTED_CHANGE_KEYS = [
  'air_date',
  'episode',
  'episode_number',
  'episode_run_time',
  'general',
  'genres',
  'images',
  'name',
  'network',
  'overview',
  'runtime',
  'season',
  'season_number',
  'status',
  'title',
  'type',
];

// Callbacks for notifying UI about updates
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

/**
 * Helper function to delay execution
 * @param ms Milliseconds to delay
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Updates movies that might have changes
 */
export async function updateMovies() {
  try {
    const movies = await Movie.getMoviesForUpdates();
    cliLogger.info(`Found ${movies.length} movies to check for updates`);
    const { currentDate, pastDate } = generateDateRange(10);

    for (const movie of movies) {
      try {
        // Add rate limiting between requests to avoid API throttling
        await sleep(500);
        await checkForMovieChanges(movie, pastDate, currentDate);
      } catch (error) {
        // Log error but continue with next movie
        cliLogger.error(`Failed to check for changes in movie ID ${movie.id}`, error);
      }
    }
  } catch (error) {
    cliLogger.error('Unexpected error while checking for movie updates', error);
    httpLogger.error(ErrorMessages.MoviesChangeFail, { error });
    throw error; // Re-throw to be caught by the job handler
  }
}

/**
 * Check for changes to a specific movie and update if necessary
 * @param content Movie to check for changes
 * @param pastDate Date past date used as the start of the change window
 * @param currentDate Date current date used as the end of the change window
 */
export async function checkForMovieChanges(content: ContentUpdates, pastDate: string, currentDate: string) {
  const tmdbService = getTMDBService();

  try {
    // Get changes for this movie from TMDB
    const changesData = await tmdbService.getMovieChanges(content.tmdb_id, pastDate, currentDate);
    const changes: Change[] = changesData.changes || [];

    // Filter for supported changes only
    const supportedChanges = changes.filter((item) => SUPPORTED_CHANGE_KEYS.includes(item.key));

    if (supportedChanges.length > 0) {
      // Fetch updated movie details from TMDB
      const movieDetails = await tmdbService.getMovieDetails(content.tmdb_id);

      // Create new Movie object with updated data
      const updatedMovie = new Movie(
        movieDetails.id,
        movieDetails.title,
        movieDetails.overview,
        movieDetails.release_date,
        movieDetails.runtime,
        movieDetails.poster_path,
        movieDetails.backdrop_path,
        movieDetails.vote_average,
        getUSMPARating(movieDetails.release_dates),
        content.id,
        getUSWatchProviders(movieDetails, 9998),
        movieDetails.genres.map((genre: { id: any }) => genre.id),
      );

      // Update the movie in our database
      await updatedMovie.update();
    }
  } catch (error) {
    cliLogger.error(`Error checking changes for movie ID ${content.id}`, error);
    httpLogger.error(ErrorMessages.MovieChangeFail, { error, movieId: content.id });
    throw errorService.handleError(error, `checkForMovieChanges(${content.id})`);
  }
}

/**
 * Updates shows that might have changes
 */
export async function updateShows() {
  try {
    const shows = await Show.getShowsForUpdates();
    cliLogger.info(`Found ${shows.length} shows to check for updates`);
    const { currentDate, pastDate } = generateDateRange(2);

    for (const show of shows) {
      try {
        await sleep(500);
        await checkForShowChanges(show, pastDate, currentDate);
      } catch (error) {
        // Log error but continue with next show
        cliLogger.error(`Failed to check for changes in show ID ${show.id}`, error);
      }
    }
  } catch (error) {
    cliLogger.error('Unexpected error while checking for show updates', error);
    httpLogger.error(ErrorMessages.ShowsChangeFail, { error });
    throw error; // Re-throw to be caught by the job handler
  }
}

/**
 * Check for changes to a specific show and update if necessary
 * @param content Show to check for changes
 * @param pastDate Date past date used as the start of the change window
 * @param currentDate Date current date used as the end of the change window
 */
export async function checkForShowChanges(content: ContentUpdates, pastDate: string, currentDate: string) {
  const tmdbService = getTMDBService();

  try {
    // Get changes for this show from TMDB
    const changesData = await tmdbService.getShowChanges(content.tmdb_id, pastDate, currentDate);
    const changes: Change[] = changesData.changes || [];

    // Filter for supported changes only
    const supportedChanges = changes.filter((item) => SUPPORTED_CHANGE_KEYS.includes(item.key));

    if (supportedChanges.length > 0) {
      // Fetch updated show details from TMDB
      const showDetails = await tmdbService.getShowDetails(content.tmdb_id);

      // Create new Show object with updated data
      const updatedShow = new Show(
        showDetails.id,
        showDetails.name,
        showDetails.overview,
        showDetails.first_air_date,
        showDetails.poster_path,
        showDetails.backdrop_path,
        showDetails.vote_average,
        getUSRating(showDetails.content_ratings),
        content.id,
        getUSWatchProviders(showDetails, 9999),
        showDetails.number_of_episodes,
        showDetails.number_of_seasons,
        showDetails.genres.map((genre: { id: any }) => genre.id),
        showDetails.status,
        showDetails.type,
        getInProduction(showDetails),
        showDetails.last_air_date,
        getEpisodeToAirId(showDetails.last_episode_to_air),
        getEpisodeToAirId(showDetails.next_episode_to_air),
        getUSNetwork(showDetails.networks),
      );

      // Update the show in our database
      await updatedShow.update();

      // Get profiles that have this show in their watchlist
      const profileIds = await updatedShow.getProfilesForShow();

      // Check if any season changes exist
      const seasonChanges = changes.filter((item) => item.key === 'season');
      if (seasonChanges.length > 0) {
        await processSeasonChanges(seasonChanges[0].items, showDetails, content, profileIds, pastDate, currentDate);
        await updateShowWatchStatusForNewContent(updatedShow.id!, profileIds);
      }
    }
  } catch (error) {
    cliLogger.error(`Error checking changes for show ID ${content.id}`, error);
    httpLogger.error(ErrorMessages.ShowChangeFail, { error, showId: content.id });
    throw errorService.handleError(error, `checkForShowChanges(${content.id})`);
  }
}

/**
 * Process season changes for a show
 * @param changes Season change items from TMDB
 * @param responseShow Full show details from TMDB
 * @param content Basic show info from our database
 * @param profileIds Profile IDs that have this show in their watchlist
 * @param pastDate Date past date used as the start of the change window
 * @param currentDate Date current date used as the end of the change window
 */
export async function processSeasonChanges(
  changes: ChangeItem[],
  responseShow: any,
  content: ContentUpdates,
  profileIds: number[],
  pastDate: string,
  currentDate: string,
) {
  const tmdbService = getTMDBService();
  const uniqueSeasonIds = filterUniqueSeasonIds(changes);
  const responseShowSeasons = responseShow.seasons || [];

  for (const seasonId of uniqueSeasonIds) {
    try {
      await sleep(500); // Rate limiting

      // Find the season in the show data
      const seasonInfo = responseShowSeasons.find((season: { id: number }) => season.id === seasonId);

      // Skip "season 0" (specials) and missing seasons
      if (!seasonInfo || seasonInfo.season_number === 0) {
        continue;
      }

      // Create Season object with updated data
      const updatedSeason = new Season(
        content.id,
        seasonInfo.id,
        seasonInfo.name,
        seasonInfo.overview,
        seasonInfo.season_number,
        seasonInfo.air_date,
        seasonInfo.poster_path,
        seasonInfo.episode_count,
      );

      // Update the season in our database
      await updatedSeason.update();

      // Add this season to all profiles that have the show
      for (const profileId of profileIds) {
        await updatedSeason.saveFavorite(profileId);
      }

      // Check if there are episode changes for this season
      const hasEpisodeChanges = await checkSeasonForEpisodeChanges(seasonId, pastDate, currentDate);

      if (hasEpisodeChanges) {
        // Get detailed season info including episodes
        const seasonDetails = await tmdbService.getSeasonDetails(content.tmdb_id, updatedSeason.season_number);
        const episodes = seasonDetails.episodes || [];

        // Update each episode
        for (const episodeData of episodes) {
          const updatedEpisode = new Episode(
            episodeData.id,
            content.id,
            updatedSeason.id!,
            episodeData.episode_number,
            episodeData.episode_type || 'standard',
            episodeData.season_number,
            episodeData.name,
            episodeData.overview,
            episodeData.air_date,
            episodeData.runtime || 0,
            episodeData.still_path,
          );

          await updatedEpisode.update();

          // Add this episode to all profiles that have the show
          for (const profileId of profileIds) {
            await updatedEpisode.saveFavorite(profileId);
          }
        }

        // Update watch status for all affected profiles
        for (const profileId of profileIds) {
          await updateSeasonWatchStatusForNewEpisodes(String(profileId), updatedSeason.id!);
        }
      }
    } catch (error) {
      // Log error but continue with next season
      cliLogger.error(`Error processing season ID ${seasonId} for show ${content.id}`, error);
    }
  }
}

/**
 * Extract unique season IDs from change items
 * @param changes Change items from TMDB
 * @returns Array of unique season IDs
 */
export function filterUniqueSeasonIds(changes: ChangeItem[]): number[] {
  const uniqueSeasonIds = new Set<number>();

  for (const change of changes) {
    if (change.value && change.value.season_id) {
      uniqueSeasonIds.add(change.value.season_id);
    }
  }

  return Array.from(uniqueSeasonIds);
}

/**
 * Check if a season has episode changes
 * @param seasonId Season ID to check
 * @param pastDate Date past date used as the start of the change window
 * @param currentDate Date current date used as the end of the change window
 * @returns True if there are episode changes, false otherwise
 */
export async function checkSeasonForEpisodeChanges(
  seasonId: number,
  pastDate: string,
  currentDate: string,
): Promise<boolean> {
  const tmdbService = getTMDBService();

  try {
    const changesData = await tmdbService.getSeasonChanges(seasonId, pastDate, currentDate);
    const changes: Change[] = changesData.changes || [];
    return changes.some((item) => item.key === 'episode');
  } catch (error) {
    cliLogger.error(`Error checking changes for season ID ${seasonId}`, error);
    httpLogger.error(ErrorMessages.SeasonChangeFail, { error, seasonId });
    return false; // Assume no changes on error
  }
}

/**
 * Update watch status for a show when new seasons are added
 * If a show was previously marked as WATCHED, update to WATCHING since there's new content
 * @param showId ID of the show in the database
 * @param profileIds List of profile IDs that have this show in their watchlist
 */
export async function updateShowWatchStatusForNewContent(showId: number, profileIds: number[]): Promise<void> {
  try {
    for (const profileId of profileIds) {
      const query = 'SELECT status FROM show_watch_status WHERE profile_id = ? AND show_id = ?';
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [profileId, showId]);

      if (rows.length > 0 && rows[0].status === 'WATCHED') {
        await Show.updateWatchStatus(String(profileId), showId, 'WATCHING');
      }
    }
  } catch (error) {
    cliLogger.error('Error updating show watch status for new content', error);
  }
}

/**
 * Update watch status for a season when new episodes are added
 * If a season was previously marked as WATCHED, update to WATCHING since there's new content
 * @param profileId ID of the profile
 * @param seasonId ID of the season in the database
 */
export async function updateSeasonWatchStatusForNewEpisodes(profileId: string, seasonId: number): Promise<void> {
  try {
    const query = 'SELECT status FROM season_watch_status WHERE profile_id = ? AND season_id = ?';
    const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [profileId, seasonId]);

    if (rows.length > 0 && rows[0].status === 'WATCHED') {
      await Season.updateWatchStatus(profileId, seasonId, 'WATCHING');

      // Also update the parent show's watch status
      const showIdQuery = 'SELECT show_id FROM seasons WHERE id = ?';
      const [showIdResult] = await getDbPool().execute<RowDataPacket[]>(showIdQuery, [seasonId]);
      if (showIdResult.length > 0) {
        const showId = showIdResult[0].show_id;
        await Show.updateWatchStatusBySeason(profileId, showId);
      }
    }
  } catch (error) {
    cliLogger.error('Error updating season watch status for new episodes', error);
  }
}

/**
 * Generate a date range for querying changes
 * @param lookBackDays Number of days to look back
 * @returns Object containing formatted current date and past date
 */
export function generateDateRange(lookBackDays: number): { currentDate: string; pastDate: string } {
  const currentDate = new Date();
  const pastDate = new Date();

  pastDate.setDate(currentDate.getDate() - lookBackDays);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    currentDate: formatDate(currentDate),
    pastDate: formatDate(pastDate),
  };
}
