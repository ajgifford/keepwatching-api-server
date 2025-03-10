import { ContentUpdates } from '../types/contentTypes';
import pool, { getDbPool } from '../utils/db';
import { DatabaseError } from '@middleware/errorMiddleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

class Movie {
  id?: number;
  tmdb_id: number;
  title: string;
  description: string;
  release_date: string;
  runtime: number;
  poster_image: string;
  backdrop_image: string;
  user_rating: number;
  mpa_rating: string;
  streaming_services?: number[];
  genreIds?: number[];

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

  async save() {
    try {
      const query =
        'INSERT into movies (tmdb_id, title, description, release_date, runtime, poster_image, backdrop_image, user_rating, mpa_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [
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
      this.genreIds?.map((genre_id) => this.saveGenre(this.id!, genre_id));
      this.streaming_services?.map((streaming_service_id) => this.saveStreamingService(this.id!, streaming_service_id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving a movie';
      throw new DatabaseError(errorMessage, error);
    }
  }

  async update() {
    try {
      const query =
        'UPDATE movies SET title = ?, description = ?, release_date = ?, runtime = ?, poster_image = ?, backdrop_image = ?, user_rating = ?, mpa_rating = ? WHERE tmdb_id = ?';
      await getDbPool().execute(query, [
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
      this.genreIds?.map((genre_id) => this.saveGenre(this.id!, genre_id));
      this.streaming_services?.map((streaming_service_id) => this.saveStreamingService(this.id!, streaming_service_id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error updating a movie';
      throw new DatabaseError(errorMessage, error);
    }
  }

  async saveGenre(movie_id: number, genre_id: number) {
    try {
      const query = 'INSERT IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?,?)';
      await getDbPool().execute(query, [movie_id, genre_id]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving a movie genre';
      throw new DatabaseError(errorMessage, error);
    }
  }

  async saveStreamingService(movie_id: number, streaming_service_id: number) {
    try {
      const query = 'INSERT IGNORE INTO movie_services (movie_id, streaming_service_id) VALUES (?, ?)';
      await getDbPool().execute(query, [movie_id, streaming_service_id]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error saving a movie streaming service';
      throw new DatabaseError(errorMessage, error);
    }
  }

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
