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
    try {
      const pool = getDbPool();
      const query = 'INSERT IGNORE INTO season_watch_status (profile_id, season_id) VALUES (?,?)';
      await pool.execute(query, [Number(profileId), seasonId]);
      const episodeQuery = 'SELECT id FROM episodes WHERE season_id = ?';
      const [episode_ids] = await pool.execute<RowDataPacket[]>(episodeQuery, [seasonId]);
      episode_ids.forEach((id) => {
        Episode.saveFavorite(profileId, id.id);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error saving a season as a favorite';
      throw new DatabaseError(errorMessage, error);
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
    try {
      const pool = getDbPool();
      const query = 'DELETE FROM season_watch_status WHERE profile_id = ? AND season_id = ?';
      await pool.execute(query, [Number(profileId), seasonId]);
      const episodeQuery = 'SELECT id FROM episodes WHERE season_id = ?';
      const [episode_ids] = await pool.execute<RowDataPacket[]>(episodeQuery, [seasonId]);
      episode_ids.forEach((id) => {
        Episode.removeFavorite(profileId, id.id);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error removing a season as a favorite';
      throw new DatabaseError(errorMessage, error);
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
      const episodesQuery = 'SELECT id FROM episodes WHERE season_id = ?';
      const [episodeRows] = await pool.execute<RowDataPacket[]>(episodesQuery, [seasonId]);
      const episodeIds = episodeRows.map((row) => row.id);

      const placeholders = episodeIds.map(() => '?').join(',');
      const episodeWatchStatusQuery = `SELECT * FROM episode_watch_status WHERE profile_id = ? AND episode_id IN (${placeholders})`;

      const [watchStatusRows] = await pool.execute<RowDataPacket[]>(episodeWatchStatusQuery, [
        profileId,
        ...episodeIds,
      ]);

      let seasonStatus: 'WATCHED' | 'NOT_WATCHED' | 'WATCHING';

      seasonStatus = watchStatusRows[0].status;
      for (let i = 1; i < watchStatusRows.length; i++) {
        if (watchStatusRows[i].status !== seasonStatus) {
          seasonStatus = 'WATCHING';
          break;
        }
      }

      const updateSeasonStatusQuery =
        'UPDATE season_watch_status SET status = ? WHERE profile_id = ? AND season_id = ?';
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
    try {
      const pool = getDbPool();
      //update season
      const seasonQuery = 'UPDATE season_watch_status SET status = ? WHERE profile_id = ? AND season_id = ?';
      const [seasonResult] = await pool.execute(seasonQuery, [status, profileId, seasonId]);
      if ((seasonResult as any).affectedRows === 0) return false;
      //update episodes (for seasons)
      const episodeQuery =
        'UPDATE episode_watch_status SET status = ? WHERE profile_id = ? AND episode_id IN (SELECT id from episodes where season_id = ?)';
      const [episodeResult] = await pool.execute(episodeQuery, [status, profileId, seasonId]);
      if ((episodeResult as any).affectedRows === 0) return false;
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown database error updating all watch statuses of a season (including episodes)';
      throw new DatabaseError(errorMessage, error);
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
      const query = 'SELECT * FROM profile_seasons where profile_id = ? and show_id = ? ORDER BY season_number';
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [Number(profileId), Number(showId)]);
      const promises = rows.map(async (result) => {
        const season = result as ProfileSeason;
        const episodes = await Episode.getEpisodesForSeason(profileId, season.season_id);
        season.episodes = episodes;
        return season;
      });
      const seasons = await Promise.all(promises);
      return seasons;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error getting all seasons for a show';
      throw new DatabaseError(errorMessage, error);
    }
  }
}

export default Season;
