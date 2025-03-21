import { io } from '../index';
import { cliLogger } from '../logger/logger';
import { BadRequestError, CustomError, NotFoundError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import Episode from '../models/episode';
import Season from '../models/season';
import Show from '../models/show';
import { getEpisodeToAirId, getInProduction, getUSNetwork, getUSRating } from '../utils/contentUtility';
import { getUSWatchProviders } from '../utils/watchProvidersUtility';
import { getTMDBService } from './tmdbService';

/**
 * Service class for handling show-related business logic
 * This separates the business logic from the controller layer
 */
export class ShowService {
  /**
   * Retrieves all shows for a specific profile
   *
   * @param profileId - ID of the profile to get shows for
   * @returns Shows associated with the profile
   */
  public async getShowsForProfile(profileId: string) {
    return await Show.getAllShowsForProfile(profileId);
  }

  /**
   * Retrieves a show and all its details for a specific profile
   *
   * @param profileId - ID of the profile to get the show for
   * @param showId - ID of the show to retrieve
   * @returns Detailed show information or null if not found
   */
  public async getShowDetailsForProfile(profileId: string, showId: string) {
    const show = await Show.getShowDetailsForProfile(profileId, showId);

    if (!show) {
      throw new NotFoundError(`Show with ID ${showId} not found`);
    }

    return show;
  }

  /**
   * Retrieves recent, upcoming, and next unwatched episodes for a profile
   *
   * @param profileId - ID of the profile to get episodes for
   * @returns Object containing recent, upcoming, and next unwatched episodes
   */
  public async getEpisodesForProfile(profileId: string) {
    const recentEpisodes = await Episode.getRecentEpisodesForProfile(profileId);
    const upcomingEpisodes = await Episode.getUpcomingEpisodesForProfile(profileId);
    const nextUnwatchedEpisodes = await Show.getNextUnwatchedEpisodesForProfile(profileId);

    return { recentEpisodes, upcomingEpisodes, nextUnwatchedEpisodes };
  }

  /**
   * Adds a show to a profile's favorites
   *
   * @param profileId - ID of the profile to add the show for
   * @param showId - TMDB ID of the show to add
   * @returns Object containing the favorited show and updated episode lists
   */
  public async addShowToFavorites(profileId: string, showId: number) {
    const existingShowToFavorite = await Show.findByTMDBId(showId);

    if (existingShowToFavorite) {
      return await this.favoriteExistingShow(existingShowToFavorite, profileId);
    }

    return await this.favoriteNewShow(showId, profileId);
  }

  /**
   * Adds an existing show to a profile's favorites
   *
   * @param showToFavorite - Show to add to favorites
   * @param profileId - ID of the profile to add the show for
   * @returns Object containing the favorited show and updated episode lists
   */
  private async favoriteExistingShow(showToFavorite: Show, profileId: string) {
    await showToFavorite.saveFavorite(profileId, true);

    const show = await Show.getShowForProfile(profileId, showToFavorite.id!);
    const episodeData = await this.getEpisodesForProfile(profileId);

    return {
      favoritedShow: show,
      ...episodeData,
    };
  }

  /**
   * Adds a new show (not yet in the database) to a profile's favorites
   * Fetches show data from TMDB API, saves it to the database, and adds to favorites
   *
   * @param showId - TMDB ID of the show to add
   * @param profileId - ID of the profile to add the show for
   * @returns Object containing the favorited show
   */
  private async favoriteNewShow(showId: number, profileId: string) {
    try {
      const tmdbService = getTMDBService();
      const responseShow = await tmdbService.getShowDetails(showId);

      const newShowToFavorite = new Show(
        responseShow.id,
        responseShow.name,
        responseShow.overview,
        responseShow.first_air_date,
        responseShow.poster_path,
        responseShow.backdrop_path,
        responseShow.vote_average,
        getUSRating(responseShow.content_ratings),
        undefined,
        getUSWatchProviders(responseShow, 9999),
        responseShow.number_of_episodes,
        responseShow.number_of_seasons,
        responseShow.genres.map((genre: { id: any }) => genre.id),
        responseShow.status,
        responseShow.type,
        getInProduction(responseShow),
        responseShow.last_air_date,
        getEpisodeToAirId(responseShow.last_episode_to_air),
        getEpisodeToAirId(responseShow.next_episode_to_air),
        getUSNetwork(responseShow.networks),
      );

      const isSaved = await newShowToFavorite.save();
      if (!isSaved) {
        throw new BadRequestError('Failed to save the show as a favorite');
      }

      await newShowToFavorite.saveFavorite(profileId, false);
      const show = await Show.getShowForProfile(profileId, newShowToFavorite.id!);

      // Start background process to fetch seasons and episodes
      this.fetchSeasonsAndEpisodes(responseShow, newShowToFavorite.id!, profileId).catch((error) =>
        cliLogger.error('Error fetching seasons and episodes:', error),
      );

      return { favoritedShow: show };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new BadRequestError(`Failed to fetch show details: ${showId}`);
    }
  }

  /**
   * Loads all seasons and episodes for a show from the TMDB API
   * This is a potentially long-running operation that runs in the background
   *
   * @param show - Show data from TMDB API
   * @param showId - ID of the show in the database
   * @param profileId - ID of the profile to add the show for
   */
  private async fetchSeasonsAndEpisodes(show: any, showId: number, profileId: string): Promise<void> {
    try {
      const tmdbService = getTMDBService();
      for (const responseSeason of show.seasons) {
        const season = new Season(
          showId,
          responseSeason.id,
          responseSeason.name,
          responseSeason.overview,
          responseSeason.season_number,
          responseSeason.air_date,
          responseSeason.poster_path,
          responseSeason.episode_count,
        );
        await season.save();
        await season.saveFavorite(Number(profileId));

        const responseData = await tmdbService.getSeasonDetails(show.id, season.season_number);

        for (const responseEpisode of responseData.episodes) {
          const episode = new Episode(
            responseEpisode.id,
            showId,
            season.id!,
            responseEpisode.episode_number,
            responseEpisode.episode_type,
            responseEpisode.season_number,
            responseEpisode.name,
            responseEpisode.overview,
            responseEpisode.air_date,
            responseEpisode.runtime,
            responseEpisode.still_path,
          );
          await episode.save();
          await episode.saveFavorite(Number(profileId));
        }
      }

      this.notifyShowDataLoaded(profileId, showId);
    } catch (error) {
      cliLogger.error('Error fetching seasons and episodes:', error);
    }
  }

  /**
   * Notifies the client that show data has been fully loaded via WebSockets
   *
   * @param profileId - ID of the profile that favorited the show
   * @param showId - ID of the show in the database
   */
  private async notifyShowDataLoaded(profileId: string, showId: number): Promise<void> {
    try {
      const account_id = await Account.findAccountIdByProfileId(profileId);
      const loadedShow = await Show.getShowForProfile(profileId, showId);

      const sockets = Array.from(io.sockets.sockets.values());
      const userSocket = sockets.find((socket) => socket.data.accountId === account_id);

      if (userSocket) {
        userSocket.emit('updateShowFavorite', {
          message: 'Show data has been fully loaded',
          show: loadedShow,
        });
      }
    } catch (error) {
      cliLogger.error('Error notifying show data loaded:', error);
    }
  }

  /**
   * Removes a show from a profile's favorites
   *
   * @param profileId - ID of the profile to remove the show from
   * @param showId - ID of the show to remove
   * @returns Object containing information about the removed show and updated episode lists
   */
  public async removeShowFromFavorites(profileId: string, showId: number) {
    const showToRemove = await Show.findById(showId);

    if (!showToRemove) {
      throw new NotFoundError(`Show with ID ${showId} not found`);
    }

    await showToRemove.removeFavorite(profileId);
    const episodeData = await this.getEpisodesForProfile(profileId);

    return {
      removedShow: showToRemove,
      ...episodeData,
    };
  }

  /**
   * Updates the watch status of a show
   *
   * @param profileId - ID of the profile to update the watch status for
   * @param showId - ID of the show to update
   * @param status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
   * @param recursive - Whether to update all seasons and episodes as well
   * @returns Success state of the update operation
   */
  public async updateShowWatchStatus(profileId: string, showId: number, status: string, recursive: boolean = false) {
    const success = recursive
      ? await Show.updateAllWatchStatuses(profileId, showId, status)
      : await Show.updateWatchStatus(profileId, showId, status);

    if (!success) {
      throw new BadRequestError(
        `Failed to update watch status. Ensure the show (ID: ${showId}) exists in your favorites.`,
      );
    }

    return success;
  }
}

// Export a singleton instance of the service
export const showService = new ShowService();
