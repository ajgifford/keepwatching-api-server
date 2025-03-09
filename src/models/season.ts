import { ProfileEpisode, ProfileSeason } from '../types/showTypes';
import { getDbPool } from '../utils/db';
import Episode from './episode';
import { DatabaseError } from '@middleware/errorMiddleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * Represents a TV show season
 * @class Season
 */
class Season {
  /** Unique identifier for the season (optional, set after saving to database) */
  id?: number;
  /** ID of the show this season belongs to */
  readonly show_id: number;
  /** TMDB API identifier for the season */
  readonly tmdb_id: number;
  /** Name of the season */
  readonly name: string;
  /** Synopsis/description of the season */
  readonly overview: string;
  /** Season number of this season */
  readonly season_number: number;
  /** Original release date of the season */
  readonly release_date: string;
  /** Path to the season's poster image */
  readonly poster_image: string;
  /** Number of episodes in the season */
  readonly number_of_episodes: number;
  /** An array of episodes for the season (optional, set when loading all seasons for a show) */
  episodes?: ProfileEpisode[] = [];

  /**
   * Creates a new Season instance
   * @param {number} show_id - ID of the show this season belongs to
   * @param {number} tmdb_id - TMDB API identifier for the season
   * @param {string} name - Name of the season
   * @param {string} overview - Synopsis/description of the season
   * @param {number} season_number - Season number of this season
   * @param {string} release_date - Original release date of the season
   * @param {string} poster_image - Path to the season's poster image
   * @param {number} number_of_episode - The number of episodes in the season
   * @param {number} [id] - Optional ID for an existing season
   */
  constructor(
    show_id: number,
    tmdb_id: number,
    name: string,
    overview: string,
    season_number: number,
    release_date: string,
    poster_image: string,
    number_of_episode: number,
    id?: number,
  ) {
    this.show_id = show_id;
    this.tmdb_id = tmdb_id;
    this.name = name;
    this.overview = overview;
    this.season_number = season_number;
    this.release_date = release_date;
    this.poster_image = poster_image;
    this.number_of_episodes = number_of_episode;
    if (id) this.id = id;
  }

  /**
   * Saves a new season to the database
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async save(): Promise<void> {
    try {
      const query =
        'INSERT INTO seasons (show_id, tmdb_id, name, overview, season_number, release_date, poster_image, number_of_episodes) VALUES (?,?,?,?,?,?,?,?)';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [
        this.show_id,
        this.tmdb_id,
        this.name,
        this.overview,
        this.season_number,
        this.release_date,
        this.poster_image,
        this.number_of_episodes,
      ]);
      this.id = result.insertId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving a season';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Updates an existing season or inserts a new one if it doesn't exist
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async update(): Promise<void> {
    try {
      const query =
        'INSERT INTO seasons (show_id, tmdb_id, name, overview, season_number, release_date, poster_image, number_of_episodes) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = ?, overview = ?, season_number = ?, release_date = ?, poster_image = ?, number_of_episodes = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [
        // Insert Values
        this.show_id,
        this.tmdb_id,
        this.name,
        this.overview,
        this.season_number,
        this.release_date,
        this.poster_image,
        this.number_of_episodes,
        // Update Values
        this.name,
        this.overview,
        this.season_number,
        this.release_date,
        this.poster_image,
        this.number_of_episodes,
      ]);
      this.id = result.insertId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error updating a season';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Adds this season to a user's favorites
   * @param {number} profileId - ID of the profile to add this season to as a favorite
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async saveFavorite(profileId: number): Promise<void> {
    try {
      const query = 'INSERT IGNORE INTO season_watch_status (profile_id, season_id) VALUES (?,?)';
      await getDbPool().execute(query, [profileId, this.id]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error saving a season as a favorite';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Adds a season and it's episodes to a user's favorites
   * @param {number} profileId - ID of the profile to add a season as a favorite
   * @param {number} seasonId - ID of the season to add as a favorite
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async saveFavoriteWithEpisodes(profileId: string, seasonId: number): Promise<void> {
    const pool = getDbPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const seasonInsert = 'INSERT IGNORE INTO season_watch_status (profile_id, season_id) VALUES (?,?)';
      await connection.execute(seasonInsert, [Number(profileId), seasonId]);

      const episodesInsert =
        'INSERT IGNORE INTO episode_watch_status (profile_id, episode_id) SELECT ?, id FROM episodes WHERE season_id = ?';
      await connection.execute(episodesInsert, [Number(profileId), seasonId]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error saving a season as a favorite';
      throw new DatabaseError(errorMessage, error);
    } finally {
      connection.release();
    }
  }

  /**
   * Removes a season from a user's favorites
   * @param {string} profileId - ID of the profile to remove the season from favorites
   * @param {number} seasonId - ID of the season to remove from favorites
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async removeFavorite(profileId: string, seasonId: number): Promise<void> {
    const pool = getDbPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const seasonDelete = 'DELETE FROM season_watch_status WHERE profile_id = ? AND season_id = ?';
      await connection.execute(seasonDelete, [Number(profileId), seasonId]);

      const episodesDelete =
        'DELETE FROM episode_watch_status WHERE profile_id = ? AND episode_id IN (SELECT id FROM episodes WHERE season_id = ?)';
      await connection.execute(episodesDelete, [Number(profileId), seasonId]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error removing a season as a favorite';
      throw new DatabaseError(errorMessage, error);
    } finally {
      connection.release();
    }
  }

  /**
   * Updates the watch status of a season for a specific profile
   * @param {string} profileId - ID of the profile to update the watch status for
   * @param {number} seasonId - ID of the season to update
   * @param {string} status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
   * @returns {Promise<boolean>} - True if the watch status was updated, false otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async updateWatchStatus(profileId: string, seasonId: number, status: string): Promise<boolean> {
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
   * Updates the watch status of a season for a specific profile based on the status of it's episodes
   * @param {string} profileId - ID of the profile to update the watch status for
   * @param {number} seasonId - ID of the season to update
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async updateWatchStatusByEpisode(profileId: string, seasonId: number): Promise<void> {
    try {
      const pool = getDbPool();

      const episodeWatchStatusQuery = `SELECT CASE WHEN COUNT(DISTINCT ews.status) = 1 THEN MAX(ews.status) ELSE 'WATCHING' END AS season_status FROM episodes e JOIN episode_watch_status ews ON e.id = ews.episode_id WHERE e.season_id = ? AND ews.profile_id = ?`;
      const [statusResult] = await pool.execute<RowDataPacket[]>(episodeWatchStatusQuery, [seasonId, profileId]);

      if (!statusResult.length) return;

      const updateSeasonStatusQuery =
        'UPDATE season_watch_status SET status = ? WHERE profile_id = ? AND season_id = ?';
      const seasonStatus = statusResult[0].season_status;
      await pool.execute(updateSeasonStatusQuery, [seasonStatus, profileId, seasonId]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error updating a season watch status using episodes';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Updates the watch status of a season and it's episodes for a specific profile
   * @param {string} profileId - ID of the profile to update the watch status for
   * @param {number} seasonId - ID of the season to update
   * @param {string} status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
   * @returns {Promise<boolean>} - True if the watch status was updated, false otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async updateAllWatchStatuses(profileId: string, seasonId: number, status: string): Promise<boolean> {
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
   * @param {string} profileId - ID of the profile to get seasons for
   * @param {number} showId - ID of the show to get seasons for
   * @returns {Promise<ProfileSeason[]>} - Array of seasons with watch status
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async getSeasonsForShow(profileId: string, showId: string): Promise<ProfileSeason[]> {
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
}

export default Season;
