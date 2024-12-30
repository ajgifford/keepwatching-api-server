import pool from '../utils/db';

class Show {
  id?: number;
  tmdb_id: number;
  title: string;
  description: string;
  release_date: string;
  image: string;
  user_rating: number;
  content_rating: string;
  streaming_service?: string;
  season_count?: number = 0;
  episode_count?: number = 0;
  genres?: string[];
  genreIds?: number[];

  constructor(
    tmdb_id: number,
    title: string,
    description: string,
    release_date: string,
    image: string,
    user_rating: number,
    content_rating: string,
    id?: number,
    streaming_service?: string,
    episode_count?: number,
    season_count?: number,
    genres?: string[],
    genreIds?: number[],
  ) {
    this.tmdb_id = tmdb_id;
    this.title = title;
    this.description = description;
    this.release_date = release_date;
    this.image = image;
    this.user_rating = user_rating;
    this.content_rating = content_rating;
    if (id) this.id = id;
    if (streaming_service) this.streaming_service = streaming_service;
    if (season_count) this.season_count = season_count;
    if (episode_count) this.episode_count = episode_count;
    if (genres) this.genres = genres;
    if (genreIds) this.genreIds = genreIds;
  }

  async save() {
    const query =
      'INSERT into shows (tmdb_id, title, description, release_date, image, user_rating, content_rating, streaming_service, season_count, episode_count) VALUE (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await pool.execute(query, [
      this.tmdb_id,
      this.title,
      this.description,
      this.release_date,
      this.image,
      this.user_rating,
      this.content_rating,
      this.streaming_service,
      this.season_count,
      this.episode_count,
    ]);
    this.id = (result as any).insertId;
    this.genreIds?.map((genre_id) => this.saveGenres(this.id!, genre_id));
  }

  async saveGenres(show_id: number, genre_id: number) {
    const query = 'INSERT into tv_show_genres (show_id, genre_id) VALUE (?,?)';
    await pool.execute(query, [show_id, genre_id]);
  }

  async saveFavorite(profile_id: string) {
    const query = 'INSERT into show_favorites (profile_id, show_id) VALUE (?,?)';
    await pool.execute(query, [Number(profile_id), this.id]);
  }

  async initializeWatchStatus(profile_id: string) {
    const query = 'INSERT into show_watch_status (profile_id, show_id) VALUE (?,?)';
    await pool.execute(query, [Number(profile_id), this.id]);
  }

  static async findByTMDBId(tmdb_id: number): Promise<Show | null> {
    const query = `SELECT * FROM shows WHERE tmdb_id = ?`;
    const [rows] = await pool.execute(query, [tmdb_id]);
    const shows = rows as any[];
    if (shows.length === 0) return null;
    const show = shows[0];
    return new Show(
      show.tmdb_id,
      show.title,
      show.description,
      show.release_date,
      show.image,
      show.user_rating,
      show.content_rating,
      show.id,
      show.streaming_service,
      show.season_count,
      show.episode_count,
      undefined,
      undefined,
    );
  }

  static async updateWatchStatus(profile_id: string, show_id: number, status: string): Promise<boolean> {
    const query = 'UPDATE showwatchstatus SET status = ? WHERE profile_id = ? AND show_id = ?';
    const [result] = await pool.execute(query, [status, profile_id, show_id]);
    if ((result as any).affectedRows === 0) return false;
    return true;
  }
}

export default Show;
