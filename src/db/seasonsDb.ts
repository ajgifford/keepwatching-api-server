import { DatabaseError } from '../middleware/errorMiddleware';
import { ProfileEpisode, ProfileSeason } from '../types/showTypes';
import { getDbPool } from '../utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface Season {
  id?: number;
  show_id: number;
  tmdb_id: number;
  name: string;
  overview: string;
  season_number: number;
  release_date: string;
  poster_image: string;
  number_of_episodes: number;
}

/**
 * Saves a new season to the database
 *
 * This function inserts a new season record with all associated metadata.
 * After successful insertion, it returns a new season object with updated ID.
 *
 * @returns A promise that resolves to the saved season with it's new id
 * @throws {DatabaseError} If a database error occurs during the operation such as connection failure or constraint violation
 *
 * @example
 * const season = createSeason(1, 12345, 'Season 1', 'First season', 1, '2023-01-01', '/path/to/poster.jpg', 10);
 * await saveSeason(season);
 * console.log(season.id); // The newly assigned database ID
 */
export async function saveSeason(season: Season): Promise<Season> {
  try {
    const query =
      'INSERT INTO seasons (show_id, tmdb_id, name, overview, season_number, release_date, poster_image, number_of_episodes) VALUES (?,?,?,?,?,?,?,?)';
    const [result] = await getDbPool().execute<ResultSetHeader>(query, [
      season.show_id,
      season.tmdb_id,
      season.name,
      season.overview,
      season.season_number,
      season.release_date,
      season.poster_image,
      season.number_of_episodes,
    ]);
    return {
      ...season,
      id: result.insertId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving a season';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Updates an existing season or inserts a new one if it doesn't exist
 *
 * This function uses MySQL's "INSERT ... ON DUPLICATE KEY UPDATE" syntax to perform
 * an upsert operation, either creating a new season or updating an existing one
 * based on the TMDB ID.
 *
 * @returns A promise that resolves to the updated season with its ID
 * @throws {DatabaseError} If a database error occurs during the operation
 *
 * @example
 * const season = createSeason(1, 12345, 'Season 1 Updated', 'Updated description', 1, '2023-01-01', '/path/to/new_poster.jpg', 12, 5);
 * await updateSeason(season);
 */
export async function updateSeason(season: Season): Promise<Season> {
  try {
    const query =
      'INSERT INTO seasons (show_id, tmdb_id, name, overview, season_number, release_date, poster_image, number_of_episodes) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = ?, overview = ?, season_number = ?, release_date = ?, poster_image = ?, number_of_episodes = ?';
    const [result] = await getDbPool().execute<ResultSetHeader>(query, [
      // Insert Values
      season.show_id,
      season.tmdb_id,
      season.name,
      season.overview,
      season.season_number,
      season.release_date,
      season.poster_image,
      season.number_of_episodes,
      // Update Values
      season.name,
      season.overview,
      season.season_number,
      season.release_date,
      season.poster_image,
      season.number_of_episodes,
    ]);

    return {
      ...season,
      id: result.insertId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error updating a season';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Adds a season to a user's favorites/watch list
 *
 * @param profileId - ID of the profile to add the season to as a favorite
 * @param seasonId - ID of the season to add as a favorite
 * @returns A promise that resolves when the favorite has been added
 * @throws {DatabaseError} If a database error occurs during the operation
 *
 * @example
 * await saveFavorite(123, 5); // Associate with profile ID 123
 */
export async function saveFavorite(profileId: number, seasonId: number): Promise<void> {
  try {
    const query = 'INSERT IGNORE INTO season_watch_status (profile_id, season_id) VALUES (?,?)';
    await getDbPool().execute(query, [profileId, seasonId]);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error saving a season as a favorite';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Updates the watch status of a season for a specific profile
 *
 * @param profileId - ID of the profile to update the watch status for
 * @param seasonId - ID of the season to update
 * @param status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
 * @returns `True` if the watch status was updated, `false` if no rows were affected
 * @throws {DatabaseError} If a database error occurs during the operation
 *
 * @example
 * // Mark season 5 as watched for profile 123
 * const updated = await updateWatchStatus('123', 5, 'WATCHED');
 * if (updated) {
 *   console.log('Season status updated successfully');
 * }
 */
export async function updateWatchStatus(profileId: string, seasonId: number, status: string): Promise<boolean> {
  try {
    const seasonQuery = 'UPDATE season_watch_status SET status = ? WHERE profile_id = ? AND season_id = ?';
    const [result] = await getDbPool().execute<ResultSetHeader>(seasonQuery, [status, profileId, seasonId]);

    // Return true if at least one row was affected (watch status was updated)
    return result.affectedRows > 0;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error updating a season watch status';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Updates the watch status of a season for a specific profile based on the status of its episodes.
 * This method examines all episodes associated with the season and determines the appropriate
 * season status based on episode statuses.
 *
 * - If all episodes have the same status, the season gets that status
 * - If episodes have mixed statuses, the season is marked as "WATCHING"
 * - If no episodes exist or no watch status information is available, nothing is updated
 *
 * @param profileId - ID of the profile to update the watch status for
 * @param seasonId - ID of the season to update
 * @returns A promise that resolves when the update is complete
 * @throws {DatabaseError} If a database error occurs during the operation
 *
 * @example
 * // Update season watch status based on its episodes
 * await updateWatchStatusByEpisode("123", 456);
 */
export async function updateWatchStatusByEpisode(profileId: string, seasonId: number): Promise<void> {
  try {
    const pool = getDbPool();

    const episodeWatchStatusQuery = `SELECT CASE WHEN COUNT(DISTINCT ews.status) = 1 THEN MAX(ews.status) ELSE 'WATCHING' END AS season_status FROM episodes e JOIN episode_watch_status ews ON e.id = ews.episode_id WHERE e.season_id = ? AND ews.profile_id = ?`;
    const [statusResult] = await pool.execute<RowDataPacket[]>(episodeWatchStatusQuery, [seasonId, profileId]);

    if (!statusResult.length) return;

    const updateSeasonStatusQuery = 'UPDATE season_watch_status SET status = ? WHERE profile_id = ? AND season_id = ?';
    const seasonStatus = statusResult[0].season_status;
    await pool.execute(updateSeasonStatusQuery, [seasonStatus, profileId, seasonId]);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error updating a season watch status using episodes';
    throw new DatabaseError(errorMessage, error);
  }
}

/**
 * Updates the watch status of a season and its episodes for a specific profile
 *
 * This method uses a transaction to ensure that both the season and all its episodes
 * are updated consistently to the same watch status
 *
 * @param profileId - ID of the profile to update the watch status for
 * @param seasonId - ID of the season to update
 * @param status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
 * @returns `True` if the watch status was updated, `false` if no rows were affected
 * @throws {DatabaseError} If a database error occurs during the operation
 *
 * @example
 * // Mark season 5 and all its episodes as watched for profile 123
 * const updated = await updateAllWatchStatuses('123', 5, 'WATCHED');
 */
export async function updateAllWatchStatuses(profileId: string, seasonId: number, status: string): Promise<boolean> {
  const pool = getDbPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    //update season
    const seasonQuery = 'UPDATE season_watch_status SET status = ? WHERE profile_id = ? AND season_id = ?';
    const [seasonResult] = await connection.execute<ResultSetHeader>(seasonQuery, [status, profileId, seasonId]);
    if (seasonResult.affectedRows === 0) return false;

    //update episodes (for seasons)
    const episodeQuery =
      'UPDATE episode_watch_status SET status = ? WHERE profile_id = ? AND episode_id IN (SELECT id from episodes where season_id = ?)';
    const [episodeResult] = await connection.execute<ResultSetHeader>(episodeQuery, [status, profileId, seasonId]);

    await connection.commit();

    return episodeResult.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown database error updating all watch statuses of a season (including episodes)';
    throw new DatabaseError(errorMessage, error);
  } finally {
    connection.release();
  }
}

/**
 * Gets all seasons for a specific show and profile with watch status
 *
 * This method retrieves all seasons for a show and then loads all episodes for those seasons.
 * It organizes the data into a hierarchical structure with episodes grouped by season.
 *
 * @param profileId - ID of the profile to get seasons for
 * @param showId - ID of the show to get seasons for
 * @returns Array of seasons with watch status and their episodes
 * @throws {DatabaseError} If a database error occurs during the operation
 *
 * @example
 * // Get all seasons with episodes for show 10 and profile 123
 * const seasons = await getSeasonsForShow('123', '10');
 * console.log(`Found ${seasons.length} seasons with a total of ${seasons.reduce((sum, season) => sum + season.episodes.length, 0)} episodes`);
 */
export async function getSeasonsForShow(profileId: string, showId: string): Promise<ProfileSeason[]> {
  try {
    const seasonQuery = 'SELECT * FROM profile_seasons WHERE profile_id = ? AND show_id = ? ORDER BY season_number';
    const [seasonRows] = await getDbPool().execute<RowDataPacket[]>(seasonQuery, [Number(profileId), Number(showId)]);

    if (seasonRows.length === 0) return [];

    const seasonIds = seasonRows.map((season) => season.season_id);
    const placeholders = seasonIds.map(() => '?').join(',');

    const episodeQuery = `SELECT * FROM profile_episodes WHERE profile_id = ? AND season_id IN (${placeholders}) ORDER BY season_id, episode_number`;
    const [episodeRows] = await getDbPool().execute<RowDataPacket[]>(episodeQuery, [Number(profileId), ...seasonIds]);

    const episodesBySeasonId: Record<number, ProfileEpisode[]> = {};
    episodeRows.forEach((episode) => {
      if (!episodesBySeasonId[episode.season_id]) {
        episodesBySeasonId[episode.season_id] = [];
      }
      episodesBySeasonId[episode.season_id].push(episode as ProfileEpisode);
    });

    return seasonRows.map((season) => ({
      ...season,
      episodes: episodesBySeasonId[season.season_id] || [],
    })) as ProfileSeason[];
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error getting all seasons for a show';
    throw new DatabaseError(errorMessage, error);
  }
}

export async function getShowIdForSeason(seasonId: number): Promise<number | null> {
  try {
    const query = 'SELECT show_id FROM seasons WHERE id = ?';
    const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [seasonId]);
    if (rows.length === 0) return null;

    return rows[0].show_id;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error getting the show id for a season';
    throw new DatabaseError(errorMessage, error);
  }
}

export async function getWatchStatus(profileId: string, seasonId: number): Promise<string | null> {
  try {
    const query = 'SELECT status FROM season_watch_status WHERE profile_id = ? AND season_id = ?';
    const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [profileId, seasonId]);

    if (rows.length === 0) return null;

    return rows[0].status;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error getting the watch status for a season';
    throw new DatabaseError(errorMessage, error);
  }
}

export function createSeason(
  showId: number,
  tmdbId: number,
  name: string,
  overview: string,
  seasonNumber: number,
  releaseDate: string,
  posterImage: string,
  numberOfEpisodes: number,
  id?: number,
): Season {
  return {
    tmdb_id: tmdbId,
    show_id: showId,
    name: name,
    overview: overview,
    season_number: seasonNumber,
    release_date: releaseDate,
    poster_image: posterImage,
    number_of_episodes: numberOfEpisodes,
    ...(id ? { id } : {}),
  };
}
