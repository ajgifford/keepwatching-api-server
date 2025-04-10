import { DatabaseError } from '../middleware/errorMiddleware';
import { Change, ContentUpdates } from '../types/contentTypes';
import { ContinueWatchingShow, NextEpisode, ProfileShow, ProfileShowWithSeasons } from '../types/showTypes';
import { getDbPool } from '../utils/db';
import { TransactionHelper } from '../utils/transactionHelper';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';

export interface Show {
  /** Unique identifier for the show (optional, set after saving to database) */
  id?: number;
  /** TMDB API identifier for the show */
  tmdb_id: number;
  /** Title of the show */
  title: string;
  /** Synopsis/description of the show */
  description: string;
  /** Release/premiere date of the show (YYYY-MM-DD format) */
  release_date: string;
  /** Path to the show's poster image */
  poster_image: string;
  /** Path to the show's backdrop image */
  backdrop_image: string;
  /** User/critical rating of the show (typically on a scale of 0-10) */
  user_rating: number;
  /** Content rating (e.g., "TV-MA", "TV-14", "TV-PG") */
  content_rating: string;
  /** IDs of streaming services where the show is available */
  streaming_services?: number[];
  /** Total number of seasons in the show */
  season_count?: number;
  /** Total number of episodes in the show */
  episode_count?: number;
  /** IDs of genres associated with the show */
  genreIds?: number[];
  /** Current production status (e.g., "Returning Series", "Ended", "Canceled") */
  status?: string;
  /** Type of show (e.g., "Scripted", "Reality", "Documentary") */
  type?: string;
  /** Flag indicating if the show is currently in production (1) or not (0) */
  in_production?: 0 | 1;
  /** Date when the most recent episode aired */
  last_air_date?: string | null;
  /** ID of the most recently aired episode */
  last_episode_to_air?: number | null;
  /** ID of the next episode scheduled to air */
  next_episode_to_air?: number | null;
  /** Network that broadcasts the show */
  network?: string | null;
}

/**
 * Saves a new show to the database
 *
 * This function inserts a new show record in the database along with its
 * associated genres and streaming services.
 *
 * @param show - The show data to save
 * @returns `True` if the show was successfully saved, `false` otherwise
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function saveShow(show: Show): Promise<boolean> {
  const transactionHelper = new TransactionHelper();

  try {
    return await transactionHelper.executeInTransaction(async (connection) => {
      const query =
        'INSERT INTO shows (tmdb_id, title, description, release_date, poster_image, backdrop_image, user_rating, content_rating, season_count, episode_count, status, type, in_production, last_air_date, last_episode_to_air, next_episode_to_air, network) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
      const [result] = await connection.execute<ResultSetHeader>(query, [
        show.tmdb_id,
        show.title,
        show.description,
        show.release_date,
        show.poster_image,
        show.backdrop_image,
        show.user_rating,
        show.content_rating,
        show.season_count,
        show.episode_count,
        show.status,
        show.type,
        show.in_production,
        show.last_air_date,
        show.last_episode_to_air,
        show.next_episode_to_air,
        show.network,
      ]);
      const showId = result.insertId;
      show.id = showId;

      const success = result.affectedRows > 0 && result.insertId > 0;
      if (success && show.id) {
        if (show.genreIds && show.genreIds.length > 0) {
          const genrePromises = show.genreIds.map((genreId) => saveShowGenre(show.id!, genreId, connection));
          await Promise.all(genrePromises);
        }

        if (show.streaming_services && show.streaming_services.length > 0) {
          const servicePromises = show.streaming_services.map((serviceId) =>
            saveShowStreamingService(show.id!, serviceId, connection),
          );
          await Promise.all(servicePromises);
        }
      }

      return success;
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving a show';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Updates an existing show in the database
 *
 * This function updates a show's metadata, genres, and streaming services.
 *
 * @param show - The show data to update
 * @returns `True` if the show was successfully updated, `false` otherwise
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function updateShow(show: Show): Promise<boolean> {
  const transactionHelper = new TransactionHelper();

  try {
    return await transactionHelper.executeInTransaction(async (connection) => {
      const query =
        'UPDATE shows SET title = ?, description = ?, release_date = ?, poster_image = ?, backdrop_image = ?, user_rating = ?, content_rating = ?, season_count = ?, episode_count = ?, status = ?, type = ?, in_production = ?, last_air_date = ?, last_episode_to_air = ?, next_episode_to_air = ?, network = ? WHERE tmdb_id = ?';
      const [result] = await connection.execute<ResultSetHeader>(query, [
        show.title,
        show.description,
        show.release_date,
        show.poster_image,
        show.backdrop_image,
        show.user_rating,
        show.content_rating,
        show.season_count,
        show.episode_count,
        show.status,
        show.type,
        show.in_production,
        show.last_air_date,
        show.last_episode_to_air,
        show.next_episode_to_air,
        show.network,
        show.tmdb_id,
      ]);

      const success = result.affectedRows > 0;
      if (success && show.id) {
        if (show.genreIds && show.genreIds.length > 0) {
          const genrePromises = show.genreIds.map((genreId) => saveShowGenre(show.id!, genreId, connection));
          await Promise.all(genrePromises);
        }

        if (show.streaming_services && show.streaming_services.length > 0) {
          const servicePromises = show.streaming_services.map((serviceId) =>
            saveShowStreamingService(show.id!, serviceId, connection),
          );
          await Promise.all(servicePromises);
        }
      }

      return success;
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error updating a show';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Associates a genre with a show
 *
 * @param showId - ID of the show
 * @param genreId - ID of the genre to associate
 * @param connection - Existing connection for transaction support
 * @returns A promise that resolves when the genre is associated
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function saveShowGenre(showId: number, genreId: number, connection: PoolConnection): Promise<void> {
  try {
    const query = 'INSERT IGNORE INTO show_genres (show_id, genre_id) VALUES (?,?)';
    await connection.execute(query, [showId, genreId]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving a show genre';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Associates a streaming service with a show
 *
 * @param showId - ID of the show
 * @param streamingServiceId - ID of the streaming service to associate
 * @param connection - Existing connection for transaction support
 * @returns A promise that resolves when the streaming service is associated
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function saveShowStreamingService(
  showId: number,
  streamingServiceId: number,
  connection: PoolConnection,
): Promise<void> {
  try {
    const query = 'INSERT IGNORE INTO show_services (show_id, streaming_service_id) VALUES (?, ?)';
    await connection.execute(query, [showId, streamingServiceId]);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error saving a show streaming service';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Adds a show to a user's favorites/watchlist
 *
 * This function inserts a record in the show_watch_status table to associate
 * the show with a user profile, enabling tracking of watch status.
 *
 * @param profileId - ID of the profile to add this show to
 * @param showId - ID of the show to add
 * @param saveChildren - `true` if the children (seasons and episodes) should also be saved, `false` otherwise
 * @returns  A promise that resolves when the favorite has been added
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function saveFavorite(profileId: string, showId: number, saveChildren: boolean): Promise<void> {
  const transactionHelper = new TransactionHelper();

  try {
    await transactionHelper.executeInTransaction(async (connection) => {
      const query = 'INSERT IGNORE INTO show_watch_status (profile_id, show_id) VALUES (?,?)';
      await connection.execute(query, [Number(profileId), showId]);

      if (saveChildren) {
        const seasonQuery = 'SELECT id FROM seasons WHERE show_id = ?';
        const [rows] = await connection.execute<RowDataPacket[]>(seasonQuery, [showId]);
        const seasonIds = rows.map((row) => row.id);

        if (seasonIds.length > 0) {
          const seasonPlaceholders = seasonIds.map(() => '(?,?)').join(',');
          const seasonParams = seasonIds.flatMap((id) => [Number(profileId), id]);
          const seasonBatchQuery = `INSERT IGNORE INTO season_watch_status (profile_id, season_id) VALUES ${seasonPlaceholders}`;
          await connection.execute(seasonBatchQuery, seasonParams);

          if (seasonIds.length > 0) {
            const seasonParamsStr = seasonIds.map(() => '?').join(',');
            const episodesBatchQuery = `INSERT IGNORE INTO episode_watch_status (profile_id, episode_id) SELECT ?, id FROM episodes WHERE season_id IN (${seasonParamsStr})`;
            await connection.execute(episodesBatchQuery, [Number(profileId), ...seasonIds]);
          }
        }
      }
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error saving a show as a favorite';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Removes a show from a user's favorites
 * This function uses a transaction to ensure that both the show and all its seasons and episodes
 * are removed from the user's favorites consistently
 *
 * @param profileId - ID of the profile to remove the show from favorites
 * @param showId - ID of the show to remove
 * @returns A promise that resolves when the show, seasons and episodes have been removed from favorites
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function removeFavorite(profileId: string, showId: number): Promise<void> {
  const transactionHelper = new TransactionHelper();

  try {
    await transactionHelper.executeInTransaction(async (connection) => {
      const seasonQuery = 'SELECT id FROM seasons WHERE show_id = ?';
      const [rows] = await connection.execute<RowDataPacket[]>(seasonQuery, [showId]);
      const seasonIds = rows.map((row) => row.id);

      if (seasonIds.length > 0) {
        const seasonPlaceholders = seasonIds.map(() => '?').join(',');
        const episodeDeleteQuery = `DELETE FROM episode_watch_status WHERE profile_id = ? AND episode_id IN (SELECT id FROM episodes WHERE season_id IN (${seasonPlaceholders}))`;
        await connection.execute(episodeDeleteQuery, [Number(profileId), ...seasonIds]);

        const seasonDeleteQuery = `DELETE FROM season_watch_status WHERE profile_id = ? AND season_id IN (${seasonPlaceholders})`;
        await connection.execute(seasonDeleteQuery, [Number(profileId), ...seasonIds]);
      }

      const showDeleteQuery = 'DELETE FROM show_watch_status WHERE profile_id = ? AND show_id = ?';
      await connection.execute(showDeleteQuery, [profileId, showId]);
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error removing a show as a favorite';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Finds a show by its database ID
 *
 * This function retrieves a show with the specified ID, including
 * its basic metadata (but not genres or streaming services).
 *
 * @param id - ID of the show to find
 * @returns `Show` object if found, `null` otherwise
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function findShowById(id: number): Promise<Show | null> {
  try {
    const query = `SELECT * FROM shows WHERE id = ?`;
    const [shows] = await getDbPool().execute<RowDataPacket[]>(query, [id]);
    if (shows.length === 0) return null;

    return transformShow(shows[0]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error finding a show by id';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Finds a show by its TMDB ID
 *
 * This function retrieves a show with the specified TMDB ID, including
 * its basic metadata (but not genres or streaming services).
 *
 * @param tmdbId - TMDB ID of the show to find
 * @returns `Show` object if found, `null` otherwise
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function findShowByTMDBId(tmdbId: number): Promise<Show | null> {
  try {
    const query = `SELECT * FROM shows WHERE tmdb_id = ?`;
    const [shows] = await getDbPool().execute<RowDataPacket[]>(query, [tmdbId]);
    if (shows.length === 0) return null;

    return transformShow(shows[0]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error finding a show by TMDB id';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Updates the watch status of a show for a specific profile
 *
 * This function marks a show as watched, watching, or not watched
 * for a specific user profile.
 *
 * @param profileId - ID of the profile to update the status for
 * @param showId - ID of the show to update
 * @param status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
 * @returns `True` if the status was updated, `false` if no rows were affected
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function updateWatchStatus(profileId: string, showId: number, status: string): Promise<boolean> {
  try {
    const showQuery = 'UPDATE show_watch_status SET status = ? WHERE profile_id = ? AND show_id = ?';
    const [result] = await getDbPool().execute<ResultSetHeader>(showQuery, [status, profileId, showId]);

    // Return true if at least one row was affected (watch status was updated)
    return result.affectedRows > 0;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error updating a show watch status';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Updates the watch status of a show for a specific profile based on the status of its seasons.
 * This function examines all seasons associated with the show and determines the appropriate
 * show status based on season statuses.
 *
 * - If all seasons have the same status, the show gets that status
 * - If seasons have mixed statuses, the shows is marked as "WATCHING"
 * - If no seasons exist or no watch status information is available, the show is marked as "NOT_WATCHED"
 *
 * @param profileId - ID of the profile to update the watch status for
 * @param showId - ID of the show to update
 * @returns A promise that resolves when the update is complete
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function updateWatchStatusBySeason(profileId: string, showId: number): Promise<void> {
  try {
    const pool = getDbPool();

    const seasonWatchStatusQuery = `SELECT CASE WHEN COUNT(DISTINCT status) = 1 THEN MAX(status) WHEN COUNT(*) = 0 THEN 'NOT_WATCHED' ELSE 'WATCHING' END AS show_status FROM seasons s JOIN season_watch_status sws ON s.id = sws.season_id WHERE s.show_id = ? AND sws.profile_id = ?`;
    const [statusResult] = await pool.execute<RowDataPacket[]>(seasonWatchStatusQuery, [showId, profileId]);

    if (!statusResult.length) return;

    const showStatusUpdateStmt = 'UPDATE show_watch_status SET status = ? WHERE profile_id = ? AND show_id = ?';
    const showStatus = statusResult[0].show_status;
    await pool.execute(showStatusUpdateStmt, [showStatus, profileId, showId]);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error updating a show watch status using seasons';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Updates the watch status of a show and its seasons and episodes for a specific profile
 *
 * This function uses a transaction to ensure that the show, all its seasons, and all their episodes
 * are updated consistently to the same watch status.
 *
 * @param profileId - ID of the profile to update the watch status for
 * @param showId - ID of the show to update
 * @param status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
 * @returns `True` if the watch status was updated, `false` if no rows were affected
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function updateAllWatchStatuses(profileId: string, showId: number, status: string): Promise<boolean> {
  const transactionHelper = new TransactionHelper();

  try {
    return await transactionHelper.executeInTransaction(async (connection) => {
      //update show
      const showQuery = 'UPDATE show_watch_status SET status = ? WHERE profile_id = ? AND show_id = ?';
      const [showResult] = await connection.execute<ResultSetHeader>(showQuery, [status, profileId, showId]);
      if (showResult.affectedRows === 0) return false;

      //update seasons (for show)
      const seasonsQuery =
        'UPDATE season_watch_status SET status = ? WHERE profile_id = ? AND season_id IN (SELECT id FROM seasons WHERE show_id = ?)';
      const [seasonsResult] = await connection.execute<ResultSetHeader>(seasonsQuery, [status, profileId, showId]);
      if (seasonsResult.affectedRows === 0) return false;

      //update episodes (for seasons/show)
      const episodesQuery =
        'UPDATE episode_watch_status SET status = ? WHERE profile_id = ? AND episode_id IN (SELECT id FROM episodes WHERE season_id IN (SELECT id FROM seasons WHERE show_id = ?))';
      const [episodesResult] = await connection.execute<ResultSetHeader>(episodesQuery, [status, profileId, showId]);

      return episodesResult.affectedRows > 0;
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown database error updating all watch statuses of a show (including seasons and episodes)';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Gets the current watch status of a show for a profile
 *
 * @param profileId - ID of the profile to get the watch status for
 * @param showId - ID of the show to get the watch status for
 * @returns The watch status of the show or null if not found
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function getWatchStatus(profileId: string, showId: number): Promise<string | null> {
  try {
    const query = 'SELECT status FROM show_watch_status WHERE profile_id = ? AND show_id = ?';
    const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [profileId, showId]);

    if (rows.length === 0) return null;

    return rows[0].status;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error getting the watch status for a show';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Retrieves all shows for a specific profile with their watch status
 *
 * This function returns all shows that a profile has added to their
 * favorites/watchlist, including watch status information.
 *
 * @param profileId - ID of the profile to get shows for
 * @returns Array of shows with their details and watch status
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function getAllShowsForProfile(profileId: string): Promise<ProfileShow[]> {
  try {
    const query = 'SELECT * FROM profile_shows where profile_id = ?';
    const [shows] = await getDbPool().execute<RowDataPacket[]>(query, [Number(profileId)]);
    const transformedRows = shows.map(transformRow);
    return transformedRows;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error getting all shows for a profile';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Gets a specific show for a profile with watch status information
 *
 * This function retrieves a single show from a profile's watchlist
 * along with its watch status.
 *
 * @param profileId - ID of the profile
 * @param showId - ID of the show to retrieve
 * @returns Show with watch status information
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function getShowForProfile(profileId: string, showId: number): Promise<ProfileShow> {
  try {
    const query = 'SELECT * FROM profile_shows where profile_id = ? AND show_id = ?';
    const [shows] = await getDbPool().execute<RowDataPacket[]>(query, [Number(profileId), showId]);
    const result = transformRow(shows[0]);

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error getting a show for a profile';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Retrieves a show with all its seasons and episodes for a specific profile
 *
 * This function fetches a show with all its associated metadata and watch status, along with
 * all seasons and their episodes. The resulting hierarchical structure provides a complete
 * view of the show's content with watch status for the specified profile.
 *
 * @param profileId - ID of the profile to get the show for
 * @param showId - ID of the show to retrieve
 * @returns Complete show object with seasons and episodes or null if not found
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function getShowWithSeasonsForProfile(
  profileId: string,
  showId: string,
): Promise<ProfileShowWithSeasons | null> {
  try {
    const query = 'SELECT * FROM profile_shows where profile_id = ? AND show_id = ?';
    const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [Number(profileId), Number(showId)]);
    if (rows.length === 0) {
      return null;
    }

    const show = transformRow(rows[0]) as ProfileShowWithSeasons;
    const seasonQuery = 'SELECT * FROM profile_seasons WHERE profile_id = ? AND show_id = ? ORDER BY season_number';
    const [seasonRows] = await getDbPool().execute<RowDataPacket[]>(seasonQuery, [Number(profileId), Number(showId)]);

    if (seasonRows.length > 0) {
      const seasonIds = seasonRows.map((season) => season.season_id);
      const placeholders = seasonIds.map(() => '?').join(',');

      const episodeQuery = `
        SELECT * FROM profile_episodes 
        WHERE profile_id = ? AND season_id IN (${placeholders}) 
        ORDER BY season_id, episode_number
      `;

      const [episodeRows] = await getDbPool().execute<RowDataPacket[]>(episodeQuery, [
        Number(profileId),
        ...seasonIds,
      ]);

      // Group episodes by season
      const episodesBySeasonId: Record<number, any[]> = {};
      episodeRows.forEach((episode) => {
        if (!episodesBySeasonId[episode.season_id]) {
          episodesBySeasonId[episode.season_id] = [];
        }
        episodesBySeasonId[episode.season_id].push(episode);
      });

      // Build the final result
      show.seasons = seasonRows.map((season) => ({
        ...season,
        episodes: episodesBySeasonId[season.season_id] || [],
      }));
    } else {
      show.seasons = [];
    }

    return show;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error getting a show and its seasons for a profile';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Gets the next unwatched episodes for shows a profile has recently watched
 *
 * This function identifies shows that a user has partially watched (status = 'WATCHING')
 * and finds the next unwatched episodes for each show. It's commonly used to build
 * a "Continue Watching" section in the UI, allowing users to easily resume shows
 * they've started but not finished.
 *
 * @param profileId - ID of the profile to get next unwatched episodes for
 * @returns Array of shows with their next unwatched episodes, ordered by most recently watched
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function getNextUnwatchedEpisodesForProfile(profileId: string): Promise<ContinueWatchingShow[]> {
  try {
    const pool = getDbPool();
    const recentShowsQuery = `SELECT * FROM profile_recent_shows_with_unwatched WHERE profile_id = ? ORDER BY last_watched_date DESC LIMIT 6`;
    const [recentShows] = await pool.execute<RowDataPacket[]>(recentShowsQuery, [profileId]);

    if (recentShows.length === 0) {
      return [];
    }

    const results = await Promise.all(
      recentShows.map(async (show) => {
        const nextEpisodesQuery = `SELECT * FROM profile_next_unwatched_episodes WHERE profile_id = ? AND show_id = ? AND episode_rank <= 2 ORDER BY season_number ASC, episode_number ASC`;
        const [episodes] = await pool.execute<RowDataPacket[]>(nextEpisodesQuery, [profileId, show.show_id]);

        return {
          show_id: show.show_id,
          show_title: show.show_title,
          poster_image: show.poster_image,
          last_watched: show.last_watched_date,
          episodes: episodes as NextEpisode[],
        };
      }),
    );

    return results;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown database error getting the next unwatched episodes for a profile';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Gets a list of shows that may need metadata updates
 *
 * This function retrieves recently shows that are still in production that may
 * need their metadata refreshed from external APIs. Useful for scheduled
 * background update tasks.
 *
 * @returns Array of shows needing updates
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function getShowsForUpdates(): Promise<ContentUpdates[]> {
  try {
    const query = `SELECT id, title, tmdb_id, created_at, updated_at from shows where in_production = 1 AND status NOT IN ('Canceled', 'Ended')`;
    const [rows] = await getDbPool().execute<RowDataPacket[]>(query);
    const shows = rows.map((row) => {
      return {
        id: row.id,
        title: row.title,
        tmdb_id: row.tmdb_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });
    return shows;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error getting shows for updates';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Gets all profile IDs that have added this show to their watchlist
 *
 * This function retrieves the IDs of all profiles that have saved this show as a favorite.
 * Useful for notifications, batch updates, and determining the popularity of a show within the system.
 *
 * @param showId - ID of the show to get profiles for
 * @returns Array of profile IDs that have this show as a favorite
 * @throws {DatabaseError} If a database error occurs during the operation
 */
export async function getProfilesForShow(showId: number): Promise<number[]> {
  try {
    const query = 'SELECT profile_id FROM show_watch_status where show_id = ?';
    const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [showId]);
    const profileIds = rows.map((row) => {
      return row.profile_id;
    });
    return profileIds;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error getting the profiles for a show';
    throw new DatabaseError(errorMessage, error);
  }
}