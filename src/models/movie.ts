import { ContentUpdates } from '../types/contentTypes';
import { getDbPool } from '../utils/db';
import { DatabaseError } from '@middleware/errorMiddleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';

/**
 * Represents a movie with comprehensive metadata and watch status tracking
 *
 * The Movie class provides methods for creating, retrieving, updating, and managing
 * movies and their relationships with profiles, genres, and streaming services.
 * Includes support for transaction-based operations to ensure data consistency.
 *
 * @class Movie
 */
class Movie {
  /** Unique identifier for the movie (optional, set after saving to database) */
  id?: number;
  /** TMDB API identifier for the movie */
  readonly tmdb_id: number;
  /** Title of the movie */
  readonly title: string;
  /** Synopsis/description of the movie */
  readonly description: string;
  /** Release date of the movie (YYYY-MM-DD format) */
  readonly release_date: string;
  /** Runtime of the movie in minutes */
  readonly runtime: number;
  /** Path to the movie's poster image */
  readonly poster_image: string;
  /** Path to the movie's backdrop image */
  readonly backdrop_image: string;
  /** User/critical rating of the movie (typically on a scale of 0-10) */
  readonly user_rating: number;
  /** MPAA rating or equivalent content rating (e.g., "PG", "PG-13", "R") */
  readonly mpa_rating: string;
  /** IDs of streaming services where the movie is available */
  readonly streaming_services?: number[];
  /** IDs of genres associated with the movie */
  readonly genreIds?: number[];

  /**
   * Creates a new Movie instance with comprehensive metadata
   *
   * @param {number} tmdb_id - TMDB API identifier for the movie
   * @param {string} title - Title of the movie
   * @param {string} description - Synopsis/description of the movie
   * @param {string} release_date - Release date of the movie (YYYY-MM-DD format)
   * @param {number} runtime - Runtime of the movie in minutes
   * @param {string} poster_image - Path to the movie's poster image
   * @param {string} backdrop_image - Path to the movie's backdrop image
   * @param {number} user_rating - User/critical rating of the movie
   * @param {string} mpa_rating - MPAA rating or equivalent content rating
   * @param {number} [id] - Optional database ID for an existing movie
   * @param {number[]} [streaming_services] - Optional array of streaming service IDs
   * @param {number[]} [genreIds] - Optional array of genre IDs
   */
  constructor(
    tmdb_id: number,
    title: string,
    description: string,
    release_date: string,
    runtime: number,
    poster_image: string,
    backdrop_image: string,
    user_rating: number,
    mpa_rating: string,
    id?: number,
    streaming_services?: number[],
    genreIds?: number[],
  ) {
    this.tmdb_id = tmdb_id;
    this.title = title;
    this.description = description;
    this.release_date = release_date;
    this.runtime = runtime;
    this.poster_image = poster_image;
    this.backdrop_image = backdrop_image;
    this.user_rating = user_rating;
    this.mpa_rating = mpa_rating;
    if (id) this.id = id;
    if (streaming_services) this.streaming_services = streaming_services;
    if (genreIds) this.genreIds = genreIds;
  }

  /**
   * Saves a new movie to the database
   *
   * This method inserts a new movie record in the database along with its
   * associated genres and streaming services.
   *
   * @returns {Promise<boolean>} True if the movie was successfully saved, false otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Save a movie
   * const movie = new Movie(12345, "The Matrix", "A computer hacker learns...", "1999-03-31", 136,
   *                        "/path/to/poster.jpg", "/path/to/backdrop.jpg", 8.7, "R",
   *                        undefined, [8, 15], [28, 878]);
   * await movie.save();
   */
  async save(): Promise<boolean> {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const query =
        'INSERT into movies (tmdb_id, title, description, release_date, runtime, poster_image, backdrop_image, user_rating, mpa_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const [result] = await connection.execute<ResultSetHeader>(query, [
        this.tmdb_id,
        this.title,
        this.description,
        this.release_date,
        this.runtime,
        this.poster_image,
        this.backdrop_image,
        this.user_rating,
        this.mpa_rating,
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
      await connection.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving a movie';
      throw new DatabaseError(errorMessage, error);
    } finally {
      connection.release();
    }
  }

  /**
   * Updates an existing movie in the database
   *
   * This method updates a movie's metadata, genres, and streaming services.
   *
   * @returns {Promise<boolean>} True if the movie was successfully updated, false otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Update a movie's details
   * const movie = await Movie.findByTMDBId(12345);
   * if (movie) {
   *   // Update properties
   *   const updatedMovie = new Movie(
   *     movie.tmdb_id,
   *     "The Matrix (Remastered)",  // Updated title
   *     movie.description,
   *     movie.release_date,
   *     movie.runtime,
   *     "/path/to/new_poster.jpg",  // Updated poster
   *     movie.backdrop_image,
   *     movie.user_rating,
   *     movie.mpa_rating,
   *     movie.id
   *   );
   *
   *   await updatedMovie.update();
   *   console.log('Movie updated successfully');
   * }
   */
  async update(): Promise<boolean> {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const query =
        'UPDATE movies SET title = ?, description = ?, release_date = ?, runtime = ?, poster_image = ?, backdrop_image = ?, user_rating = ?, mpa_rating = ? WHERE tmdb_id = ?';
      const [result] = await connection.execute<ResultSetHeader>(query, [
        this.title,
        this.description,
        this.release_date,
        this.runtime,
        this.poster_image,
        this.backdrop_image,
        this.user_rating,
        this.mpa_rating,
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

      return success;
    } catch (error) {
      connection.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error updating a movie';
      throw new DatabaseError(errorMessage, error);
    } finally {
      connection.release();
    }
  }

  /**
   * Associates a genre with this movie
   *
   * @param {number} movie_id - ID of the movie
   * @param {number} genre_id - ID of the genre to associate
   * @param {PoolConnection} [connection] - Optional existing connection for transaction support
   * @returns {Promise<void>} A promise that resolves when the genre is associated
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async saveGenre(movie_id: number, genre_id: number, connection: PoolConnection) {
    try {
      const query = 'INSERT IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?,?)';
      await connection.execute(query, [movie_id, genre_id]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving a movie genre';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Associates a streaming service with this movie
   *
   * @param {number} movie_id - ID of the movie
   * @param {number} streaming_service_id - ID of the streaming service to associate
   * @param {PoolConnection} [connection] - Optional existing connection for transaction support
   * @returns {Promise<void>} A promise that resolves when the streaming service is associated
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async saveStreamingService(movie_id: number, streaming_service_id: number, connection: PoolConnection) {
    try {
      const query = 'INSERT IGNORE INTO movie_services (movie_id, streaming_service_id) VALUES (?, ?)';
      await connection.execute(query, [movie_id, streaming_service_id]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error saving a movie streaming service';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Adds this movie to a user's favorites/watchlist
   *
   * This method inserts a record in the movie_watch_status table to associate
   * the movie with a user profile, enabling tracking of watch status.
   *
   * @param {string} profile_id - ID of the profile to add this movie to
   * @returns {Promise<void>} A promise that resolves when the favorite has been added
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Add a movie to a profile's favorites
   * const movie = await Movie.findById(123);
   * if (movie) {
   *   await movie.saveFavorite('456'); // Add to profile ID 456
   *   console.log('Movie added to favorites');
   * }
   */
  async saveFavorite(profile_id: string) {
    try {
      const query = 'INSERT IGNORE INTO movie_watch_status (profile_id, movie_id) VALUES (?,?)';
      await getDbPool().execute(query, [Number(profile_id), this.id]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error saving a movie as a favorite';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Removes this movie from a user's favorites/watchlist
   *
   * This method deletes the record in the movie_watch_status table that
   * associates the movie with a user profile.
   *
   * @param {string} profile_id - ID of the profile to remove this movie from
   * @returns {Promise<void>} A promise that resolves when the favorite has been removed
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Remove a movie from a profile's favorites
   * const movie = await Movie.findById(123);
   * if (movie) {
   *   await movie.removeFavorite('456'); // Remove from profile ID 456
   *   console.log('Movie removed from favorites');
   * }
   */
  async removeFavorite(profile_id: string) {
    try {
      const query = 'DELETE FROM movie_watch_status WHERE profile_id = ? AND movie_id = ?';
      await getDbPool().execute(query, [profile_id, this.id]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error removing a movie as a favorite';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Finds a movie by its database ID
   *
   * This static method retrieves a movie with the specified ID, including
   * its basic metadata (but not genres or streaming services).
   *
   * @param {number} id - ID of the movie to find
   * @returns {Promise<Movie | null>} Movie object if found, null otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   const movie = await Movie.findById(123);
   *   if (movie) {
   *     console.log(`Found movie: ${movie.title} (${movie.release_date})`);
   *   } else {
   *     console.log('Movie not found');
   *   }
   * } catch (error) {
   *   console.error('Error finding movie:', error);
   * }
   */
  static async findById(id: number): Promise<Movie | null> {
    try {
      const query = `SELECT * FROM movies WHERE id = ?`;
      const [movies] = await getDbPool().execute<RowDataPacket[]>(query, [id]);
      if (movies.length === 0) return null;
      return this.transformMovie(movies[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error finding a movie by id';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Finds a movie by its TMDB ID
   *
   * This static method retrieves a movie with the specified TMDB ID, including
   * its basic metadata (but not genres or streaming services).
   *
   * @param {number} tmdb_id - TMDB ID of the movie to find
   * @returns {Promise<Movie | null>} Movie object if found, null otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   const movie = await Movie.findByTMDBId(12345);
   *   if (movie) {
   *     console.log(`Found movie: ${movie.title} (ID: ${movie.id})`);
   *   } else {
   *     console.log('Movie not found in our database');
   *   }
   * } catch (error) {
   *   console.error('Error finding movie:', error);
   * }
   */
  static async findByTMDBId(tmdb_id: number): Promise<Movie | null> {
    try {
      const query = `SELECT * FROM movies WHERE tmdb_id = ?`;
      const [movies] = await getDbPool().execute<RowDataPacket[]>(query, [tmdb_id]);
      if (movies.length === 0) return null;
      return this.transformMovie(movies[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error finding a movie by TMDB id';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Transforms a raw database row into a Movie object
   *
   * @param {any} movie - Raw database row containing movie data
   * @returns {Movie} Properly structured Movie object
   * @private
   */
  private static transformMovie(movie: any): Movie {
    return new Movie(
      movie.tmdb_id,
      movie.title,
      movie.description,
      movie.release_date,
      movie.runtime,
      movie.poster_image,
      movie.backdrop_image,
      movie.user_rating,
      movie.mpa_rating,
      movie.id,
      undefined,
      undefined,
    );
  }

  /**
   * Updates the watch status of a movie for a specific profile
   *
   * This static method marks a movie as watched, watching, or not watched
   * for a specific user profile.
   *
   * @param {string} profile_id - ID of the profile to update the status for
   * @param {number} movie_id - ID of the movie to update
   * @param {string} status - New watch status ('WATCHED', 'WATCHING', or 'NOT_WATCHED')
   * @returns {Promise<boolean>} True if the status was updated, false if no rows were affected
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Mark movie 123 as watched for profile 456
   * const updated = await Movie.updateWatchStatus('456', 123, 'WATCHED');
   * if (updated) {
   *   console.log('Movie marked as watched');
   * } else {
   *   console.log('Movie not in watchlist or status already set');
   * }
   */
  static async updateWatchStatus(profile_id: string, movie_id: number, status: string): Promise<boolean> {
    try {
      const query = 'UPDATE movie_watch_status SET status = ? WHERE profile_id = ? AND movie_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [status, profile_id, movie_id]);

      // Return true if at least one row was affected (watch status was updated)
      return result.affectedRows > 0;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error updating a movie watch status';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Retrieves all movies for a specific profile with their watch status
   *
   * This static method returns all movies that a profile has added to their
   * favorites/watchlist, including watch status information.
   *
   * @param {string} profile_id - ID of the profile to get movies for
   * @returns {Promise<any[]>} Array of movies with their details and watch status
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get all movies for profile 456
   * const movies = await Movie.getAllMoviesForProfile('456');
   * console.log(`Found ${movies.length} movies in watchlist`);
   *
   * // Count movies by watch status
   * const watchedCount = movies.filter(m => m.watch_status === 'WATCHED').length;
   * console.log(`${watchedCount} movies watched out of ${movies.length}`);
   *
   * @performance This method uses a view for better performance with complex joins
   */
  static async getAllMoviesForProfile(profile_id: string) {
    try {
      const query = 'SELECT * FROM profile_movies where profile_id = ?';
      const [rows] = await getDbPool().execute(query, [Number(profile_id)]);
      return rows;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error getting all movies for a profile';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Gets a specific movie for a profile with watch status information
   *
   * This static method retrieves a single movie from a profile's watchlist
   * along with its watch status.
   *
   * @param {string} profile_id - ID of the profile
   * @param {number} movie_id - ID of the movie to retrieve
   * @returns {Promise<any>} Movie with watch status information
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get movie 123 with watch status for profile 456
   * const movie = await Movie.getMovieForProfile('456', 123);
   * if (movie) {
   *   console.log(`${movie.title}: ${movie.watch_status}`);
   * } else {
   *   console.log('Movie not in watchlist');
   * }
   *
   * @performance Uses an indexed view for efficient retrieval with joins
   */
  static async getMovieForProfile(profile_id: string, movie_id: number) {
    try {
      const query = 'SELECT * FROM profile_movies where profile_id = ? AND movie_id = ?';
      const [movies] = await getDbPool().execute<RowDataPacket[]>(query, [Number(profile_id), movie_id]);
      return movies[0];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error getting a movie for a profile';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Gets recently released movies from a profile's watchlist
   *
   * This static method retrieves movies from a profile's watchlist that have
   * been released within the last 60 days, ordered by release date.
   *
   * @param {string} profile_id - ID of the profile to get recent movies for
   * @returns {Promise<any[]>} Array of recently released movies
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get recent movie releases for profile 456
   * const recentMovies = await Movie.getRecentMovieReleasesForProfile('456');
   * console.log(`Found ${recentMovies.length} recent releases in watchlist`);
   *
   * @performance Uses a date range index for efficient date-based querying
   * with a LIMIT clause to prevent excessive data retrieval
   */
  static async getRecentMovieReleasesForProfile(profile_id: string) {
    try {
      const query =
        'SELECT movie_id from profile_movies WHERE profile_id = ? AND release_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY) AND CURRENT_DATE() ORDER BY release_date DESC LIMIT 6';
      const [rows] = await getDbPool().execute(query, [Number(profile_id)]);
      return rows;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error getting recent movies for a profile';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Gets upcoming movie releases from a profile's watchlist
   *
   * This static method retrieves movies from a profile's watchlist that are
   * scheduled to be released within the next 60 days, ordered by release date.
   *
   * @param {string} profile_id - ID of the profile to get upcoming movies for
   * @returns {Promise<any[]>} Array of upcoming movie releases
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get upcoming movie releases for profile 456
   * const upcomingMovies = await Movie.getUpcomingMovieReleasesForProfile('456');
   * console.log(`${upcomingMovies.length} upcoming movies in your watchlist`);
   *
   * @performance Uses a date range index for efficient date-based querying
   * with a LIMIT clause to prevent excessive data retrieval
   */
  static async getUpcomingMovieReleasesForProfile(profile_id: string) {
    try {
      const query =
        'SELECT movie_id from profile_movies WHERE profile_id = ? AND release_date BETWEEN DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY) AND DATE_ADD(CURRENT_DATE(), INTERVAL 60 DAY) ORDER BY release_date LIMIT 6';
      const [rows] = await getDbPool().execute(query, [Number(profile_id)]);
      return rows;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error getting upcoming movies for a profile';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Gets a list of movies that may need metadata updates
   *
   * This static method retrieves recently added or released movies that may
   * need their metadata refreshed from external APIs. Useful for scheduled
   * background update tasks.
   *
   * @returns {Promise<ContentUpdates[]>} Array of movies needing updates
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get movies that may need updates
   * const moviesToUpdate = await Movie.getMoviesForUpdates();
   * console.log(`${moviesToUpdate.length} movies need metadata updates`);
   *
   * @performance Uses a date-based filter for recently added/released movies
   * to minimize the data set. Consider adding an index on the release_date column.
   */
  static async getMoviesForUpdates(): Promise<ContentUpdates[]> {
    try {
      const query = `SELECT id, title, tmdb_id, created_at, updated_at FROM movies WHERE release_date > NOW() - INTERVAL 30 DAY`;
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query);
      const movies = rows.map((row) => {
        return {
          id: row.id,
          title: row.title,
          tmdb_id: row.tmdb_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      });
      return movies;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error getting movies for updates';
      throw new DatabaseError(errorMessage, error);
    }
  }
}

export default Movie;
