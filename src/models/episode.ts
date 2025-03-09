import { ProfileEpisode } from '../types/showTypes';
import { DatabaseError } from '@middleware/errorMiddleware';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * Represents a TV show episode
 * @class Episode
 */
class Episode {
  /** Unique identifier for the episode (optional, set after saving to database) */
  id?: number;
  /** TMDB API identifier for the episode */
  readonly tmdb_id: number;
  /** ID of the show this episode belongs to */
  readonly show_id: number;
  /** ID of the season this episode belongs to */
  readonly season_id: number;
  /** Episode number within its season */
  readonly episode_number: number;
  /** Type of episode (e.g., "standard", "mid_season_finale", etc.) */
  readonly episode_type: string;
  /** Season number of this episode */
  readonly season_number: number;
  /** Title of the episode */
  readonly title: string;
  /** Synopsis/description of the episode */
  readonly overview: string;
  /** Original air date of the episode */
  readonly air_date: string;
  /** Runtime of the episode in minutes */
  readonly runtime: number;
  /** Path to the episode's still image */
  readonly still_image: string;

  /**
   * Creates a new Episode instance
   * @param {number} tmdb_id - TMDB API identifier for the episode
   * @param {number} show_id - ID of the show this episode belongs to
   * @param {number} season_id - ID of the season this episode belongs to
   * @param {number} episode_number - Episode number within its season
   * @param {string} episode_type - Type of episode
   * @param {number} season_number - Season number of this episode
   * @param {string} title - Title of the episode
   * @param {string} overview - Synopsis/description of the episode
   * @param {string} air_date - Original air date of the episode
   * @param {number} runtime - Runtime of the episode in minutes
   * @param {string} still_image - Path to the episode's still image
   * @param {number} [id] - Optional ID for an existing episode
   */
  constructor(
    tmdb_id: number,
    show_id: number,
    season_id: number,
    episode_number: number,
    episode_type: string,
    season_number: number,
    title: string,
    overview: string,
    air_date: string,
    runtime: number,
    still_image: string,
    id?: number,
  ) {
    this.tmdb_id = tmdb_id;
    this.show_id = show_id;
    this.season_id = season_id;
    this.episode_number = episode_number;
    this.episode_type = episode_type;
    this.season_number = season_number;
    this.title = title;
    this.overview = overview;
    this.air_date = air_date;
    this.runtime = runtime;
    this.still_image = still_image;
    if (id) this.id = id;
  }

  /**
   * Saves a new episode to the database
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async save(): Promise<void> {
    try {
      const query =
        'INSERT into episodes (tmdb_id, season_id, show_id, episode_number, episode_type, season_number, title, overview, air_date, runtime, still_image) VALUES (?,?,?,?,?,?,?,?,?,?,?)';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [
        this.tmdb_id,
        this.season_id,
        this.show_id,
        this.episode_number,
        this.episode_type,
        this.season_number,
        this.title,
        this.overview,
        this.air_date,
        this.runtime,
        this.still_image,
      ]);
      this.id = result.insertId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving an episode';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Updates an existing episode or inserts a new one if it doesn't exist
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async update(): Promise<void> {
    try {
      const query =
        'INSERT into episodes (tmdb_id, season_id, show_id, episode_number, episode_type, season_number, title, overview, air_date, runtime, still_image) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), episode_number = ?, episode_type = ?, season_number = ?, title = ?, overview = ?, air_date = ?, runtime = ?, still_image = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [
        //Insert Values
        this.tmdb_id,
        this.season_id,
        this.show_id,
        this.episode_number,
        this.episode_type,
        this.season_number,
        this.title,
        this.overview,
        this.air_date,
        this.runtime,
        this.still_image,
        //Update Values
        this.episode_number,
        this.episode_type,
        this.season_number,
        this.title,
        this.overview,
        this.air_date,
        this.runtime,
        this.still_image,
      ]);
      this.id = result.insertId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error updating an episode';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Adds this episode to a user's favorites
   * @param {number} profileId - ID of the profile to add this episode to as a favorite
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async saveFavorite(profileId: number): Promise<void> {
    try {
      const query = 'INSERT IGNORE INTO episode_watch_status (profile_id, episode_id) VALUES (?,?)';
      await getDbPool().execute(query, [Number(profileId), this.id]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error saving an episode as a favorite';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Adds an episode to a user's favorites
   * @param {string} profileId - ID of the profile to add an episode as a favorite
   * @param {number} episodeId - ID of the episode to add as a favorite
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async saveFavorite(profileId: string, episodeId: number): Promise<void> {
    try {
      const query = 'INSERT IGNORE INTO episode_watch_status (profile_id, episode_id) VALUES (?,?)';
      await getDbPool().execute(query, [Number(profileId), episodeId]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error saving an episode as a favorite';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Removes an episode from a user's favorites
   * @param {string} profileId - ID of the profile to remove the episode from favorites
   * @param {number} episodeId - ID of the episode to remove from favorites
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async removeFavorite(profileId: string, episodeId: number): Promise<void> {
    try {
      const query = 'DELETE FROM episode_watch_status WHERE profile_id = ? AND episode_id = ?';
      await getDbPool().execute(query, [Number(profileId), episodeId]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error removing an episode as a favorite';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Updates the watch status of an episode for a specific profile
   * @param {string} profileId - ID of the profile to update the watch status for
   * @param {number} episodeId - ID of the episode to update
   * @param {string} status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
   * @returns {Promise<boolean>} - True if the watch status was updated, false otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async updateWatchStatus(profileId: string, episodeId: number, status: string): Promise<boolean> {
    try {
      const query = 'UPDATE episode_watch_status SET status = ? WHERE profile_id = ? AND episode_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [status, profileId, episodeId]);

      // Return true if at least one row was affected (watch status was updated)
      return result.affectedRows > 0;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error updating an episode watch status';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Gets all episodes for a specific season and profile with watch status
   * @param {string} profileId - ID of the profile to get episodes for
   * @param {number} seasonId - ID of the season to get episodes for
   * @returns {Promise<ProfileEpisode[]>} - Array of episodes with watch status
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async getEpisodesForSeason(profileId: string, seasonId: number): Promise<ProfileEpisode[]> {
    try {
      const query = 'SELECT * FROM profile_episodes where profile_id = ? and season_id = ? ORDER BY episode_number';
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [Number(profileId), seasonId]);
      return rows as ProfileEpisode[];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error getting episodes for a season';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Finds an episode by its ID
   * @param {number} id - ID of the episode to find
   * @returns {Promise<Episode | null>} - Episode object if found, null otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async findById(id: number): Promise<Episode | null> {
    try {
      const query = 'SELECT * FROM episodes WHERE id = ?';
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [id]);

      if (rows.length === 0) return null;

      const episode = rows[0];
      return new Episode(
        episode.tmdb_id,
        episode.show_id,
        episode.season_id,
        episode.episode_number,
        episode.episode_type,
        episode.season_number,
        episode.title,
        episode.overview,
        episode.air_date,
        episode.runtime,
        episode.still_image,
        episode.id,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error finding an episode by ID';
      throw new DatabaseError(errorMessage, error);
    }
  }
}

export default Episode;
