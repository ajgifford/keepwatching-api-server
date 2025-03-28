import { cliLogger, httpLogger } from '../logger/logger';
import { ErrorMessages } from '../logger/loggerModel';
import Episode from '../models/episode';
import Season from '../models/season';
import Show from '../models/show';
import { Change, ChangeItem, ContentUpdates } from '../types/contentTypes';
import { SUPPORTED_CHANGE_KEYS, filterUniqueSeasonIds, generateDateRange, sleep } from '../utils/changesUtility';
import { getEpisodeToAirId, getInProduction, getUSNetwork, getUSRating } from '../utils/contentUtility';
import { getUSWatchProviders } from '../utils/watchProvidersUtility';
import { errorService } from './errorService';
import { seasonService } from './seasonService';
import { showService } from './showService';
import { getTMDBService } from './tmdbService';

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
        await showService.updateShowWatchStatusForNewContent(updatedShow.id!, profileIds);
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
          await seasonService.updateSeasonWatchStatusForNewEpisodes(String(profileId), updatedSeason.id!);
        }
      }
    } catch (error) {
      // Log error but continue with next season
      cliLogger.error(`Error processing season ID ${seasonId} for show ${content.id}`, error);
    }
  }
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
