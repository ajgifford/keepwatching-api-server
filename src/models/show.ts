import { ContentUpdates } from '../types/contentTypes';
import { ContinueWatchingShow, NextEpisode, ProfileShow, ProfileShowWithSeasons } from '../types/showTypes';
import { getDbPool } from '../utils/db';
import Season from './season';
import { DatabaseError } from '@middleware/errorMiddleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import NodeCache from 'node-cache';

const showCache = new NodeCache({ stdTTL: 900 });

/**
 * Represents a TV show with comprehensive metadata and watch status tracking
 *
 * The Show class provides methods for creating, retrieving, updating, and managing
 * TV shows and their relationships with profiles, seasons, episodes, genres, and streaming services.
 * Includes support for transaction-based operations to ensure data consistency.
 *
 * @class Show
 */
class Show {
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
  season_count?: number = 0;

  /** Total number of episodes in the show */
  episode_count?: number = 0;

  /** IDs of genres associated with the show */
  genreIds?: number[];

  /** Current production status (e.g., "Returning Series", "Ended", "Canceled") */
  status?: string;

  /** Type of show (e.g., "Scripted", "Reality", "Documentary") */
  type?: string;

  /** Flag indicating if the show is currently in production (1) or not (0) */
  in_production?: 0 | 1;

  /** Date when the most recent episode aired */
  last_air_date?: string | null = null;

  /** ID of the most recently aired episode */
  last_episode_to_air?: number | null = null;

  /** ID of the next episode scheduled to air */
  next_episode_to_air?: number | null = null;

  /** Network that broadcasts the show */
  network?: string | null;

  /**
   * Creates a new Show instance with comprehensive metadata
   *
   * @param tmdbId - TMDB API identifier for the show
   * @param title - Title of the show
   * @param description - Synopsis/description of the show
   * @param releaseDate - Release/premiere date of the show (YYYY-MM-DD format)
   * @param posterImage - Path to the show's poster image
   * @param backdropImage - Path to the show's backdrop image
   * @param userRating - User/critical rating of the show
   * @param contentRating - Content rating (e.g., "TV-MA", "TV-14", "TV-PG")
   * @param id - Optional database ID for an existing show
   * @param streamingServices - Optional array of streaming service IDs
   * @param episodeCount - Optional total number of episodes
   * @param seasonCount - Optional total number of seasons
   * @param genreIds - Optional array of genre IDs
   * @param status - Optional production status
   * @param type - Optional show type
   * @param inProduction - Optional flag indicating if show is in production
   * @param lastAirDate - Optional date when the most recent episode aired
   * @param lastEpisodeToAir - Optional ID of the most recently aired episode
   * @param nextEpisodeToAir - Optional ID of the next episode scheduled to air
   * @param network - Optional network that broadcasts the show
   */
  constructor(
    tmdbId: number,
    title: string,
    description: string,
    releaseDate: string,
    posterImage: string,
    backdropImage: string,
    userRating: number,
    contentRating: string,
    id?: number,
    streamingServices?: number[],
    episodeCount?: number,
    seasonCount?: number,
    genreIds?: number[],
    status?: string,
    type?: string,
    inProduction?: 0 | 1,
    lastAirDate?: string | null,
    lastEpisodeToAir?: number | null,
    nextEpisodeToAir?: number | null,
    network?: string | null,
  ) {
    this.tmdb_id = tmdbId;
    this.title = title;
    this.description = description;
    this.release_date = releaseDate;
    this.poster_image = posterImage;
    this.backdrop_image = backdropImage;
    this.user_rating = userRating;
    this.content_rating = contentRating;
    if (id) this.id = id;
    if (streamingServices) this.streaming_services = streamingServices;
    if (seasonCount) this.season_count = seasonCount;
    if (episodeCount) this.episode_count = episodeCount;
    if (genreIds) this.genreIds = genreIds;
    if (status) this.status = status;
    if (type) this.type = type;
    if (inProduction !== undefined) this.in_production = inProduction;
    if (lastAirDate) this.last_air_date = lastAirDate;
    if (lastEpisodeToAir) this.last_episode_to_air = lastEpisodeToAir;
    if (nextEpisodeToAir !== undefined) this.next_episode_to_air = nextEpisodeToAir;
    if (network !== undefined) this.network = network;
  }

  /**
   * Saves a new show to the database
   *
   * This method inserts a new show record in the database along with its
   * associated genres and streaming services.
   *
   * @returns `True` if the show was successfully saved, `false` otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async save(): Promise<boolean> {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const query =
        'INSERT INTO shows (tmdb_id, title, description, release_date, poster_image, backdrop_image, user_rating, content_rating, season_count, episode_count, status, type, in_production, last_air_date, last_episode_to_air, next_episode_to_air, network) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [
        this.tmdb_id,
        this.title,
        this.description,
        this.release_date,
        this.poster_image,
        this.backdrop_image,
        this.user_rating,
        this.content_rating,
        this.season_count,
        this.episode_count,
        this.status,
        this.type,
        this.in_production,
        this.last_air_date,
        this.last_episode_to_air,
        this.next_episode_to_air,
        this.network,
      ]);
      this.id = result.insertId;

      if (this.genreIds && this.genreIds.length > 0) {
        const genrePromises = this.genreIds.map((genreId) => this.saveGenre(this.id!, genreId, connection));
        await Promise.all(genrePromises);
      }

      if (this.streaming_services && this.streaming_services.length > 0) {
        const servicePromises = this.streaming_services.map((serviceId) =>
          this.saveStreamingService(this.id!, serviceId, connection),
        );
        await Promise.all(servicePromises);
      }

      connection.commit();

      return true;
    } catch (error) {
      console.log(error);
      await connection.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving a show';
      throw new DatabaseError(errorMessage, error);
    } finally {
      connection.release();
    }
  }

  /**
   * Updates an existing show in the database
   *
   * This method updates a show's metadata, genres, and streaming services.
   *
   * @returns `True` if the show was successfully updated, `false` otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async update(): Promise<boolean> {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const query =
        'UPDATE shows SET title = ?, description = ?, release_date = ?, poster_image = ?, backdrop_image = ?, user_rating = ?, content_rating = ?, season_count = ?, episode_count = ?, status = ?, type = ?, in_production = ?, last_air_date = ?, last_episode_to_air = ?, next_episode_to_air = ?, network = ? WHERE tmdb_id = ?';
      const [result] = await connection.execute<ResultSetHeader>(query, [
        this.title,
        this.description,
        this.release_date,
        this.poster_image,
        this.backdrop_image,
        this.user_rating,
        this.content_rating,
        this.season_count,
        this.episode_count,
        this.status,
        this.type,
        this.in_production,
        this.last_air_date,
        this.last_episode_to_air,
        this.next_episode_to_air,
        this.network,
        this.tmdb_id,
      ]);

      const success = result.affectedRows !== undefined;
      if (success && this.id) {
        if (this.genreIds && this.genreIds.length > 0) {
          const genrePromises = this.genreIds.map((genreId) => this.saveGenre(this.id!, genreId, connection));
          await Promise.all(genrePromises);
        }

        if (this.streaming_services && this.streaming_services.length > 0) {
          const servicePromises = this.streaming_services.map((serviceId) =>
            this.saveStreamingService(this.id!, serviceId, connection),
          );
          await Promise.all(servicePromises);
        }
      }

      connection.commit();

      return true;
    } catch (error) {
      await connection.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error updating a show';
      throw new DatabaseError(errorMessage, error);
    } finally {
      connection.release();
    }
  }

  /**
   * Associates a genre with this show
   *
   * @param showId - ID of the show
   * @param genreId - ID of the genre to associate
   * @param connection - Existing connection for transaction support
   * @returns A promise that resolves when the genre is associated
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async saveGenre(showId: number, genreId: number, connection: PoolConnection): Promise<void> {
    try {
      const query = 'INSERT IGNORE INTO show_genres (show_id, genre_id) VALUES (?,?)';
      await connection.execute(query, [showId, genreId]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving a show genre';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Associates a streaming service with this show
   *
   * @param showId - ID of the show
   * @param streamingServiceId - ID of the streaming service to associate
   * @param connection - Existing connection for transaction support
   * @returns A promise that resolves when the streaming service is associated
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async saveStreamingService(showId: number, streamingServiceId: number, connection: PoolConnection): Promise<void> {
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
   * Adds this show to a user's favorites/watchlist
   *
   * This method inserts a record in the show_watch_status table to associate
   * the show with a user profile, enabling tracking of watch status.
   *
   * @param profileId - ID of the profile to add this show to
   * @param  saveChildren - `true` if the children (seasons and episodes) should also be saved, `false` otherwise
   * @returns  A promise that resolves when the favorite has been added
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Add a show to a profile's favorites
   * const show = await Show.findById(123);
   * if (show) {
   *   await show.saveFavorite('456', true); // Add to profile ID 456 and save all children
   *   console.log('Show added to favorites');
   * }
   */
  async saveFavorite(profileId: string, saveChildren: boolean): Promise<void> {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const query = 'INSERT IGNORE INTO show_watch_status (profile_id, show_id) VALUES (?,?)';
      await connection.execute(query, [Number(profileId), this.id]);

      if (saveChildren) {
        const seasonQuery = 'SELECT id FROM seasons WHERE show_id = ?';
        const [rows] = await connection.execute<RowDataPacket[]>(seasonQuery, [this.id]);
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

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error saving a show as a favorite';
      throw new DatabaseError(errorMessage, error);
    } finally {
      connection.release();
    }
  }

  /**
   * Removes this show from a user's favorites
   * This method uses a transaction to ensure that both the show and all its seasons and episodes
   * are removed from the user's favorites consistently
   *
   * @param profileId - ID of the profile to remove the show from favorites
   * @returns A promise that resolves when the show, seasons and episodes have been removed from favorites
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Remove this show and all its seasons and episodes from profile 123's favorites
   * await Show.removeFavorite('123');
   */
  async removeFavorite(profileId: string): Promise<void> {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const seasonQuery = 'SELECT id FROM seasons WHERE show_id = ?';
      const [rows] = await connection.execute(seasonQuery, [this.id]);
      const seasonIds = (rows as any[]).map((row) => row.id);

      if (seasonIds.length > 0) {
        const seasonPlaceholders = seasonIds.map(() => '?').join(',');
        const episodeDeleteQuery = `DELETE FROM episode_watch_status WHERE profile_id = ? AND episode_id IN (SELECT id FROM episodes WHERE season_id IN (${seasonPlaceholders}))`;
        await connection.execute(episodeDeleteQuery, [Number(profileId), ...seasonIds]);

        const seasonDeleteQuery = `DELETE FROM season_watch_status WHERE profile_id = ? AND season_id IN (${seasonPlaceholders})`;
        await connection.execute(seasonDeleteQuery, [Number(profileId), ...seasonIds]);
      }

      const showDeleteQuery = 'DELETE FROM show_watch_status WHERE profile_id = ? AND show_id = ?';
      await connection.execute(showDeleteQuery, [profileId, this.id]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error removing a show as a favorite';
      throw new DatabaseError(errorMessage, error);
    } finally {
      connection.release();
    }
  }

  /**
   * Finds a show by its database ID
   *
   * This static method retrieves a show with the specified ID, including
   * its basic metadata (but not genres or streaming services).
   *
   * @param id - ID of the show to find
   * @returns `Show` object if found, `null` otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   const show = await Show.findById(123);
   *   if (show) {
   *     console.log(`Found show: ${show.title} (${show.release_date})`);
   *   } else {
   *     console.log('Show not found');
   *   }
   * } catch (error) {
   *   console.error('Error finding show:', error);
   * }
   */
  static async findById(id: number): Promise<Show | null> {
    try {
      const query = `SELECT * FROM shows WHERE id = ?`;
      const [shows] = await getDbPool().execute<RowDataPacket[]>(query, [id]);
      if (shows.length === 0) return null;

      return Show.transformShow(shows[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error finding a show by id';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Finds a show by its TMDB ID
   *
   * This static method retrieves a show with the specified TMDB ID, including
   * its basic metadata (but not genres or streaming services).
   *
   * @param tmdbId - TMDB ID of the show to find
   * @returns `Show` object if found, `null` otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   const show = await Show.findByTMDBId(12345);
   *   if (show) {
   *     console.log(`Found show: ${show.title} (ID: ${show.id})`);
   *   } else {
   *     console.log('Show not found in our database');
   *   }
   * } catch (error) {
   *   console.error('Error finding show:', error);
   * }
   */
  static async findByTMDBId(tmdbId: number): Promise<Show | null> {
    try {
      const query = `SELECT * FROM shows WHERE tmdb_id = ?`;
      const [shows] = await getDbPool().execute<RowDataPacket[]>(query, [tmdbId]);
      if (shows.length === 0) return null;

      return this.transformShow(shows[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error finding a show by TMDB id';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Updates the watch status of a show for a specific profile
   *
   * This static method marks a show as watched, watching, or not watched
   * for a specific user profile.
   *
   * @param profileId - ID of the profile to update the status for
   * @param showId - ID of the show to update
   * @param status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
   * @returns `True` if the status was updated, `false` if no rows were affected
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Mark show 123 as watched for profile 456
   * const updated = await Show.updateWatchStatus('456', 123, 'WATCHED');
   * if (updated) {
   *   console.log('Show marked as watched');
   * } else {
   *   console.log('Show not in watchlist or status already set');
   * }
   */
  static async updateWatchStatus(profileId: string, showId: number, status: string): Promise<boolean> {
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
   * This method examines all seasons associated with the show and determines the appropriate
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
   *
   * @example
   * // Update show watch status based on its episodes
   * await Show.updateWatchStatusBySeason("123", 456);
   */
  static async updateWatchStatusBySeason(profileId: string, showId: number): Promise<void> {
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
   * This method uses a transaction to ensure that the show, all its seasons, and all their episodes
   * are updated consistently to the same watch status.
   *
   * @param profileId - ID of the profile to update the watch status for
   * @param showId - ID of the show to update
   * @param status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
   * @returns `True` if the watch status was updated, `false` if no rows were affected
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Mark show 45 and all its seasons and episodes as watched for profile 123
   * const updated = await Show.updateAllWatchStatuses('123', 45, 'WATCHED');
   * if (updated) {
   *   console.log('Show and all its content marked as watched');
   * } else {
   *   console.log('Failed to update watch status - show might not be in watchlist');
   * }
   *
   * @example
   * // Mark show as not watched, resetting watch progress
   * await Show.updateAllWatchStatuses('123', 45, 'NOT_WATCHED');
   *
   * @performance This method performs multiple database operations within a transaction.
   * For shows with many seasons/episodes, this can be a heavier operation.
   */
  static async updateAllWatchStatuses(profileId: string, showId: number, status: string): Promise<boolean> {
    const pool = getDbPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

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

      connection.commit();

      return episodesResult.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown database error updating all watch statuses of a show (including seasons and episodes)';
      throw new DatabaseError(errorMessage, error);
    } finally {
      connection.release();
    }
  }

  /**
   * Retrieves all shows for a specific profile with their watch status
   *
   * This static method returns all shows that a profile has added to their
   * favorites/watchlist, including watch status information.
   *
   * @param profile_id - ID of the profile to get shows for
   * @returns Array of shows with their details and watch status
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get all shows for profile 456
   * const shows = await Show.getAllShowsForProfile('456');
   * console.log(`Found ${shows.length} shows in watchlist`);
   *
   * // Count shows by watch status
   * const watchedCount = shows.filter(s => s.watch_status === 'WATCHED').length;
   * console.log(`${watchedCount} shows watched out of ${shows.length}`);
   *
   * @performance
   * - Uses a database view for efficient retrieval with complex joins
   * - Results are not paginated and may be large for users with many shows
   * - Response time scales with the number of shows in the profile's watchlist
   */
  static async getAllShowsForProfile(profileId: string) {
    try {
      const query = 'SELECT * FROM profile_shows where profile_id = ?';
      const [shows] = await getDbPool().execute<RowDataPacket[]>(query, [Number(profileId)]);
      const transformedRows = shows.map(this.transformRow);
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
   * This static method retrieves a single show from a profile's watchlist
   * along with its watch status.
   *
   * @param profileId - ID of the profile
   * @param showId - ID of the show to retrieve
   * @returns Show with watch status information
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get show 123 with watch status for profile 456
   * const show = await Show.getShowForProfile('456', 123);
   * if (show) {
   *   console.log(`${show.title}: ${show.watch_status}`);
   * } else {
   *   console.log('Show not in watchlist');
   * }
   *
   * @performance Uses an indexed view for efficient retrieval with joins
   */
  static async getShowForProfile(profileId: string, showId: number): Promise<ProfileShow> {
    try {
      const cacheKey = `profile_${profileId}_show_${showId}`;
      const cachedShow = showCache.get<ProfileShow>(cacheKey);
      if (cachedShow) {
        return cachedShow;
      }

      const query = 'SELECT * FROM profile_shows where profile_id = ? AND show_id = ?';
      const [shows] = await getDbPool().execute<RowDataPacket[]>(query, [Number(profileId), showId]);
      const result = this.transformRow(shows[0]);

      showCache.set(cacheKey, result);

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
   * This method fetches a show with all its associated metadata and watch status, along with
   * all seasons and their episodes. The resulting hierarchical structure provides a complete
   * view of the show's content with watch status for the specified profile.
   *
   * @param profileId - ID of the profile to get the show for
   * @param showId - ID of the show to retrieve
   * @returns Complete show object with seasons and episodes or null if not found
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get show 123 with all seasons and episodes for profile 456
   * try {
   *   const show = await Show.getShowWithSeasonsForProfile('456', '123');
   *
   *   if (show) {
   *     console.log(`${show.title} (${show.season_count} seasons, ${show.episode_count} episodes)`);
   *
   *     // Process seasons and episodes
   *     show.seasons.forEach(season => {
   *       console.log(`Season ${season.season_number}: ${season.name} (${season.watch_status})`);
   *
   *       season.episodes.forEach(episode => {
   *         console.log(`  S${episode.season_number}E${episode.episode_number}: ${episode.title} (${episode.watch_status})`);
   *       });
   *     });
   *   } else {
   *     console.log('Show not found or not in profile watchlist');
   *   }
   * } catch (error) {
   *   console.error('Error fetching show with seasons:', error);
   * }
   *
   * @performance
   * - This is a resource-intensive method that performs multiple database queries
   * - Performance scales with the number of seasons and episodes in the show
   * - For shows with many seasons, consider using a paginated version of this method
   * - Database indexes on profile_id, show_id, and season_id are critical for performance
   */
  static async getShowWithSeasonsForProfile(
    profileId: string,
    show_id: string,
  ): Promise<ProfileShowWithSeasons | null> {
    try {
      const query = 'SELECT * FROM profile_shows where profile_id = ? AND show_id = ?';
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [Number(profileId), Number(show_id)]);
      if (rows.length === 0) {
        return null;
      }

      const show = this.transformRow(rows[0]) as ProfileShowWithSeasons;
      const seasons = await Season.getSeasonsForShow(profileId, show_id);
      show.seasons = seasons;

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
   * This method identifies shows that a user has partially watched (status = 'WATCHING')
   * and finds the next unwatched episodes for each show. It's commonly used to build
   * a "Continue Watching" section in the UI, allowing users to easily resume shows
   * they've started but not finished.
   *
   * @param profileId - ID of the profile to get next unwatched episodes for
   * @returns Array of shows with their next unwatched episodes, ordered by most recently watched
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get next unwatched episodes for profile 123
   * try {
   *   const continueWatching = await Show.getNextUnwatchedEpisodesForProfile('123');
   *
   *   if (continueWatching.length > 0) {
   *     console.log('Continue watching:');
   *
   *     continueWatching.forEach(show => {
   *       console.log(`${show.show_title} (Last watched: ${new Date(show.last_watched).toLocaleDateString()})`);
   *
   *       show.episodes.forEach(episode => {
   *         console.log(`  Next: S${episode.season_number}E${episode.episode_number}: ${episode.episode_title}`);
   *         console.log(`  Airs on: ${new Date(episode.air_date).toLocaleDateString()}`);
   *       });
   *     });
   *   } else {
   *     console.log('No shows in progress');
   *   }
   * } catch (error) {
   *   console.error('Error fetching continue watching list:', error);
   * }
   *
   * @performance
   * - This method performs multiple database queries in sequence
   * - Performance is primarily affected by the number of shows the profile has watched recently
   * - Results are limited to 6 shows with up to 2 episodes each to maintain performance
   * - Database views are used for optimal query performance
   */
  static async getNextUnwatchedEpisodesForProfile(profileId: string): Promise<ContinueWatchingShow[]> {
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
   * This static method retrieves recently shows that are still in production that may
   * need their metadata refreshed from external APIs. Useful for scheduled
   * background update tasks.
   *
   * @returns Array of shows needing updates
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get shows that may need updates
   * const showsToUpdate = await Show.getShowsForUpdates();
   * console.log(`${showsToUpdate.length} shows need metadata updates`);
   *
   * @performance Uses a date-based filter for recently added/released shows
   * to minimize the data set.
   */
  static async getShowsForUpdates(): Promise<ContentUpdates[]> {
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
   * This method retrieves the IDs of all profiles that have saved this show as a favorite.
   * Useful for notifications, batch updates, and determining the popularity of a show within the system.
   *
   * @returns Array of profile IDs that have this show as a favorite
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get all profiles watching a show
   * try {
   *   const show = await Show.findById(123);
   *
   *   if (show) {
   *     const profileIds = await show.getProfilesForShow();
   *
   *     console.log(`${show.title} is in ${profileIds.length} profiles' watchlists`);
   *
   *     // Notify all profiles about a new episode
   *     for (const profileId of profileIds) {
   *       await NotificationService.sendNotification(
   *         profileId,
   *         `New episode of ${show.title} available!`,
   *         `S${newEpisode.season_number}E${newEpisode.episode_number}: ${newEpisode.title} is now available.`
   *       );
   *     }
   *   }
   * } catch (error) {
   *   console.error('Error getting profiles for show:', error);
   * }
   *
   * @performance
   * - This method performs a single database query
   * - Performance scales with the number of profiles that have added this show
   * - Results are not paginated, so could be large for popular shows
   * - Database index on show_id in show_watch_status table is essential
   */
  async getProfilesForShow(): Promise<number[]> {
    try {
      const query = 'SELECT profile_id FROM show_watch_status where show_id = ?';
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [this.id]);
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

  /**
   * Transforms a raw database row into a Show object
   *
   * @param show - Raw database row containing show data
   * @returns Properly structured `Show` object
   * @private
   */
  private static transformShow(show: any): Show {
    return new Show(
      show.tmdb_id,
      show.title,
      show.description,
      show.release_date,
      show.poster_image,
      show.backdrop_image,
      show.user_rating,
      show.content_rating,
      show.id,
      undefined,
      show.episode_count,
      show.season_count,
      undefined,
    );
  }

  /**
   * Transforms a raw database row into a structured ProfileShow object
   *
   * This method processes the raw database results from the profile_shows view
   * and transforms them into a well-structured ProfileShow object with proper typing.
   * It specifically handles the nested episode objects for last/next episodes.
   *
   * @param row - Raw database row from the profile_shows view
   * @returns Properly structured ProfileShow object
   * @private
   */
  private static transformRow(row: RowDataPacket): ProfileShow {
    if (!row) {
      throw new Error('Cannot transform undefined or null row');
    }

    const {
      profile_id,
      show_id,
      tmdb_id,
      title,
      description,
      release_date,
      poster_image,
      backdrop_image,
      user_rating,
      content_rating,
      season_count,
      episode_count,
      watch_status,
      status,
      type,
      in_production,
      genres,
      streaming_services,
      last_episode_title,
      last_episode_air_date,
      last_episode_number,
      last_episode_season,
      next_episode_title,
      next_episode_air_date,
      next_episode_number,
      next_episode_season,
    } = row;

    return {
      profile_id,
      show_id,
      tmdb_id,
      title,
      description,
      release_date,
      poster_image,
      backdrop_image,
      user_rating,
      content_rating,
      season_count,
      episode_count,
      watch_status,
      status,
      type,
      in_production,
      genres,
      streaming_services,
      last_episode: last_episode_title
        ? {
            title: last_episode_title,
            air_date: last_episode_air_date,
            episode_number: last_episode_number,
            season_number: last_episode_season,
          }
        : null,
      next_episode: next_episode_title
        ? {
            title: next_episode_title,
            air_date: next_episode_air_date,
            episode_number: next_episode_number,
            season_number: next_episode_season,
          }
        : null,
    };
  }
}

export default Show;
