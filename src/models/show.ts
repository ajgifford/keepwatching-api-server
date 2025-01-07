import pool from '../utils/db';
import Season from './season';

class Show {
  id?: number;
  tmdb_id: number;
  title: string;
  description: string;
  release_date: string;
  image: string;
  user_rating: number;
  content_rating: string;
  streaming_services?: number[];
  season_count?: number = 0;
  episode_count?: number = 0;
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
    streaming_services?: number[],
    episode_count?: number,
    season_count?: number,
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
    if (streaming_services) this.streaming_services = streaming_services;
    if (season_count) this.season_count = season_count;
    if (episode_count) this.episode_count = episode_count;
    if (genreIds) this.genreIds = genreIds;
  }

  async save() {
    const query =
      'INSERT into shows (tmdb_id, title, description, release_date, image, user_rating, content_rating, season_count, episode_count) VALUE (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await pool.execute(query, [
      this.tmdb_id,
      this.title,
      this.description,
      this.release_date,
      this.image,
      this.user_rating,
      this.content_rating,
      this.season_count,
      this.episode_count,
    ]);
    this.id = (result as any).insertId;
    this.genreIds?.map((genre_id) => this.saveGenres(this.id!, genre_id));
    this.streaming_services?.map((streaming_service_id) => this.saveStreamingServices(this.id!, streaming_service_id));
  }

  async saveGenres(show_id: number, genre_id: number) {
    const query = 'INSERT into tv_show_genres (show_id, genre_id) VALUE (?,?)';
    await pool.execute(query, [show_id, genre_id]);
  }

  async saveStreamingServices(show_id: number, streaming_service_id: number) {
    const query = 'INSERT into tv_show_services (show_id, streaming_service_id) VALUE (?, ?)';
    await pool.execute(query, [show_id, streaming_service_id]);
  }

  async saveFavorite(profile_id: string, save_children: boolean) {
    const query = 'INSERT into show_watch_status (profile_id, show_id) VALUE (?,?)';
    await pool.execute(query, [Number(profile_id), this.id]);
    if (save_children) {
      const seasonQuery = 'SELECT id FROM seasons WHERE show_id = ?';
      const [rows] = await pool.execute(seasonQuery, [this.id]);
      const season_ids = rows as any[];
      season_ids.forEach((id) => {
        Season.saveFavoriteWithEpisodes(profile_id, id.id);
      });
    }
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
      undefined,
      show.episode_count,
      show.season_count,
      undefined,
    );
  }

  static async updateWatchStatus(profile_id: string, show_id: number, status: string): Promise<boolean> {
    const showQuery = 'UPDATE show_watch_status SET status = ? WHERE profile_id = ? AND show_id = ?';
    const [showResult] = await pool.execute(showQuery, [status, profile_id, show_id]);
    if ((showResult as any).affectedRows === 0) return false;
    return true;
  }

  static async updateAllWatchStatuses(profile_id: string, show_id: number, status: string): Promise<boolean> {
    //update show
    const showQuery = 'UPDATE show_watch_status SET status = ? WHERE profile_id = ? AND show_id = ?';
    const [showResult] = await pool.execute(showQuery, [status, profile_id, show_id]);
    if ((showResult as any).affectedRows === 0) return false;
    //update seasons (for show)
    const seasonsQuery =
      'UPDATE season_watch_status SET status = ? WHERE profile_id = ? AND season_id IN (SELECT id FROM seasons WHERE show_id = ?)';
    const [seasonsResult] = await pool.execute(seasonsQuery, [status, profile_id, show_id]);
    if ((seasonsResult as any).affectedRows === 0) return false;
    //update episodes (for seasons/show)
    const episodesQuery =
      'UPDATE episode_watch_status SET status = ? WHERE profile_id = ? AND episode_id IN (SELECT id FROM episodes WHERE season_id IN (SELECT id FROM seasons WHERE show_id = ?))';
    const [episodesResult] = await pool.execute(episodesQuery, [status, profile_id, show_id]);
    if ((episodesResult as any).affectedRows === 0) return false;
    return true;
  }

  static async getAllShowsForProfile(profile_id: string) {
    const query = 'SELECT * FROM profile_shows where profile_id = ?';
    const [rows] = await pool.execute(query, [Number(profile_id)]);
    return rows;
  }

  static async getShowForProfile(profile_id: string, show_id: number) {
    const query = 'SELECT * FROM profile_shows where profile_id = ? AND show_id = ?';
    const [rows] = await pool.execute(query, [Number(profile_id), show_id]);
    const shows = rows as any[];
    return shows[0];
  }

  static async getShowWithSeasonsForProfile(profile_id: string, show_id: string) {
    const query = 'SELECT * FROM profile_shows where profile_id = ? AND show_id = ?';
    const [rows] = await pool.execute(query, [Number(profile_id), Number(show_id)]);
    const shows = rows as any[];
    const show = shows[0];
    const seasons = await Season.getSeasonsForShow(profile_id, show_id);
    show.seasons = seasons;
    return show;
  }
}

export default Show;
