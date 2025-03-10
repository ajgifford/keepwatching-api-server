import { ProfileEpisode } from '../types/showTypes';
import { DatabaseError } from '@middleware/errorMiddleware';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * Represents a TV show episode with comprehensive metadata and watch status tracking
 * 
 * The Episode class handles the creation, updating, and management of TV show episodes,
 * including their relationships with shows, seasons, and watch status tracking.
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
   * 
   * @param {number} tmdb_id - TMDB API identifier for the episode
   * @param {number} show_id - ID of the show this episode belongs to
   * @param {number} season_id - ID of the season this episode belongs to
   * @param {number} episode_number - Episode number within its season
   * @param {string} episode_type - Type of episode (e.g., "standard", "mid_season_finale")
   * @param {number} season_number - Season number this episode belongs to
   * @param {string} title - Title of the episode
   * @param {string} overview - Synopsis/description of the episode
   * @param {string} air_date - Original air date of the episode (YYYY-MM-DD format)
   * @param {number} runtime - Runtime of the episode in minutes
   * @param {string} still_image - Path to the episode's still image
   * @param {number} [id] - Optional database ID for an existing episode
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
   * 
   * This method inserts a new episode record with all associated metadata.
   * After successful insertion, the episode's id property is updated with the new database ID.
   *
   * @returns {Promise<void>} A promise that resolves when the episode has been saved
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * const episode = new Episode(
   *   98765,         // TMDB ID
   *   42,            // Show ID
   *   15,            // Season ID
   *   3,             // Episode number
   *   'standard',    // Episode type
   *   2,             // Season number
   *   'The One With the Test',  // Title
   *   'Episode description...',  // Overview
   *   '2023-05-15',  // Air date
   *   45,            // Runtime in minutes
   *   '/path/to/still.jpg'  // Still image path
   * );
   * 
   * await episode.save();
   * console.log(`Episode saved with ID: ${episode.id}`);
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
   * 
   * This method uses MySQL's "INSERT ... ON DUPLICATE KEY UPDATE" syntax to perform
   * an upsert operation, either creating a new episode or updating an existing one
   * based on the TMDB ID.
   *
   * @returns {Promise<void>} A promise that resolves when the episode has been updated
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Updating an existing episode with new information
   * const episode = new Episode(
   *   98765,         // TMDB ID (same as existing)
   *   42,            // Show ID
   *   15,            // Season ID
   *   3,             // Episode number
   *   'standard',    // Episode type
   *   2,             // Season number
   *   'The One With the Updated Title',  // Updated title
   *   'Updated episode description...',  // Updated overview
   *   '2023-05-15',  // Air date
   *   48,            // Updated runtime
   *   '/path/to/new_still.jpg'  // Updated still image
   * );
   * 
   * await episode.update();
   * console.log('Episode updated successfully');
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
   * Adds this episode to a user's favorites/watch list
   * 
   * This method creates an entry in the watch status table to track a user's
   * interest in this episode, enabling features like watch history and progress tracking.
   *
   * @param {number} profileId - ID of the profile to add this episode to as a favorite
   * @returns {Promise<void>} A promise that resolves when the favorite has been added
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * const episode = new Episode(/* ... */); // Create or retrieve episode
   * await episode.saveFavorite(123); // Add to profile ID 123's favorites
   * console.log('Episode added to favorites');
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
   * Adds an episode to a user's favorites/watch list
   * 
   * Static version of the saveFavorite method that can be called without an instance.
   *
   * @param {string} profileId - ID of the profile to add the episode to as a favorite
   * @param {number} episodeId - ID of the episode to add as a favorite
   * @returns {Promise<void>} A promise that resolves when the favorite has been added
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Add episode with ID 789 to profile 456's favorites
   * await Episode.saveFavorite('456', 789);
   * console.log('Episode added to favorites');
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
   * Removes an episode from a user's favorites/watch list
   * 
   * This method deletes the watch status entry for an episode, removing it from
   * a user's list of tracked episodes.
   *
   * @param {string} profileId - ID of the profile to remove the episode from
   * @param {number} episodeId - ID of the episode to remove
   * @returns {Promise<void>} A promise that resolves when the favorite has been removed
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Remove episode with ID 789 from profile 456's favorites
   * await Episode.removeFavorite('456', 789);
   * console.log('Episode removed from favorites');
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
   * 
   * This method marks an episode as watched, watching, or not watched for a user,
   * allowing for tracking watch progress of TV shows.
   *
   * @param {string} profileId - ID of the profile to update the watch status for
   * @param {number} episodeId - ID of the episode to update
   * @param {string} status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
   * @returns {Promise<boolean>} True if the watch status was updated, false if no rows were affected
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Mark episode 789 as watched for profile 456
   * const updated = await Episode.updateWatchStatus('456', 789, 'WATCHED');
   * if (updated) {
   *   console.log('Episode marked as watched');
   * } else {
   *   console.log('No update occurred - episode might not be in favorites');
   * }
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
   * 
   * This method retrieves all episodes belonging to a season along with their
   * watch status for a specific user profile.
   *
   * @param {string} profileId - ID of the profile to get episodes for
   * @param {number} seasonId - ID of the season to get episodes for
   * @returns {Promise<ProfileEpisode[]>} Array of episodes with watch status
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   // Get all episodes for season 15 and profile 456
   *   const episodes = await Episode.getEpisodesForSeason('456', 15);
   *   console.log(`Found ${episodes.length} episodes`);
   *   
   *   // Count watched episodes
   *   const watchedCount = episodes.filter(ep => ep.watch_status === 'WATCHED').length;
   *   console.log(`${watchedCount} episodes watched out of ${episodes.length}`);
   * } catch (error) {
   *   console.error('Error fetching episodes:', error);
   * }
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
   * Finds an episode by its database ID
   * 
   * This method retrieves a specific episode by its unique identifier.
   *
   * @param {number} id - ID of the episode to find
   * @returns {Promise<Episode | null>} Episode object if found, null otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   const episode = await Episode.findById(789);
   *   if (episode) {
   *     console.log(`Found episode: ${episode.title} (S${episode.season_number}E${episode.episode_number})`);
   *   } else {
   *     console.log('Episode not found');
   *   }
   * } catch (error) {
   *   console.error('Error finding episode:', error);
   * }
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
