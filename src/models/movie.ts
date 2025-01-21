import pool from '../utils/db';
import { ContentUpdates } from './content';
import { QueryResult, RowDataPacket } from 'mysql2';

class Movie {
  id?: number;
  tmdb_id: number;
  title: string;
  description: string;
  release_date: string;
  runtime: number;
  image: string;
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
    image: string,
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
    this.image = image;
    this.user_rating = user_rating;
    this.mpa_rating = mpa_rating;
    if (id) this.id = id;
    if (streaming_services) this.streaming_services = streaming_services;
    if (genreIds) this.genreIds = genreIds;
  }

  async save() {
    const query =
      'INSERT into movies (tmdb_id, title, description, release_date, runtime, image, user_rating, mpa_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await pool.execute(query, [
      this.tmdb_id,
      this.title,
      this.description,
      this.release_date,
      this.runtime,
      this.image,
      this.user_rating,
      this.mpa_rating,
    ]);
    this.id = (result as any).insertId;
    this.genreIds?.map((genre_id) => this.saveGenre(this.id!, genre_id));
    this.streaming_services?.map((streaming_service_id) => this.saveStreamingService(this.id!, streaming_service_id));
  }

  async update() {
    const query =
      'UPDATE movies SET title = ?, description = ?, release_date = ?, runtime = ?, image = ?, user_rating = ?, mpa_rating = ? WHERE tmdb_id = ?';
    await pool.execute(query, [
      this.title,
      this.description,
      this.release_date,
      this.runtime,
      this.image,
      this.user_rating,
      this.mpa_rating,
      this.tmdb_id,
    ]);
    this.genreIds?.map((genre_id) => this.saveGenre(this.id!, genre_id));
    this.streaming_services?.map((streaming_service_id) => this.saveStreamingService(this.id!, streaming_service_id));
  }

  async saveGenre(movie_id: number, genre_id: number) {
    const query = 'INSERT IGNORE into movie_genres (movie_id, genre_id) VALUES (?,?)';
    await pool.execute(query, [movie_id, genre_id]);
  }

  async saveStreamingService(movie_id: number, streaming_service_id: number) {
    const query = 'INSERT IGNORE into movie_services (movie_id, streaming_service_id) VALUES (?, ?)';
    await pool.execute(query, [movie_id, streaming_service_id]);
  }

  async saveFavorite(profile_id: string) {
    const query = 'INSERT into movie_watch_status (profile_id, movie_id) VALUES (?,?)';
    await pool.execute(query, [Number(profile_id), this.id]);
  }

  async removeFavorite(profile_id: string) {
    const query = 'DELETE FROM movie_watch_status WHERE profile_id = ? AND movie_id = ?';
    await pool.execute(query, [profile_id, this.id]);
  }

  static async findById(id: number): Promise<Movie | null> {
    const query = `SELECT * FROM movies WHERE id = ?`;
    const [rows] = await pool.execute(query, [id]);
    const movies = rows as any[];
    if (movies.length === 0) return null;
    return this.transformMovie(movies[0]);
  }

  static async findByTMDBId(tmdb_id: number): Promise<Movie | null> {
    const query = `SELECT * FROM movies WHERE tmdb_id = ?`;
    const [rows] = await pool.execute(query, [tmdb_id]);
    const movies = rows as any[];
    if (movies.length === 0) return null;
    return this.transformMovie(movies[0]);
  }

  private static transformMovie(movie: any): Movie {
    return new Movie(
      movie.tmdb_id,
      movie.title,
      movie.description,
      movie.release_date,
      movie.runtime,
      movie.image,
      movie.user_rating,
      movie.mpa_rating,
      movie.id,
      undefined,
      undefined,
    );
  }

  static async updateWatchStatus(profile_id: string, movie_id: number, status: string): Promise<boolean> {
    const query = 'UPDATE movie_watch_status SET status = ? WHERE profile_id = ? AND movie_id = ?';
    const [result] = await pool.execute(query, [status, profile_id, movie_id]);
    if ((result as any).affectedRows === 0) return false;
    return true;
  }

  static async getAllMoviesForProfile(profile_id: string) {
    const query = 'SELECT * FROM profile_movies where profile_id = ?';
    const [rows] = await pool.execute(query, [Number(profile_id)]);
    return rows;
  }

  static async getMovieForProfile(profile_id: string, movie_id: number) {
    const query = 'SELECT * FROM profile_movies where profile_id = ? AND movie_id = ?';
    const [rows] = await pool.execute(query, [Number(profile_id), movie_id]);
    const movies = rows as any[];
    return movies[0];
  }

  static async getRecentMovieReleasesForProfile(profile_id: string) {
    const query =
      'SELECT movie_id from profile_movies WHERE profile_id = ? AND release_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY) AND CURRENT_DATE() ORDER BY release_date DESC LIMIT 6';
    const [rows] = await pool.execute(query, [Number(profile_id)]);
    return rows;
  }

  static async getUpcomingMovieReleasesForProfile(profile_id: string) {
    const query =
      'SELECT movie_id from profile_movies WHERE profile_id = ? AND release_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 60 DAY) ORDER BY release_date LIMIT 6';
    const [rows] = await pool.execute(query, [Number(profile_id)]);
    return rows;
  }

  static async getMoviesForUpdates(): Promise<ContentUpdates[]> {
    const query = `SELECT id, title, tmdb_id, created_at, updated_at FROM movies WHERE release_date > NOW() - INTERVAL 30 DAY`;
    const [rows] = await pool.execute<RowDataPacket[]>(query);
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
  }
}

export default Movie;
