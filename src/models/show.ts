import pool from '../utils/db';
import { ContentUpdates } from './content';
import Season from './season';
import { RowDataPacket } from 'mysql2';

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
  status?: string;
  type?: string;
  in_production?: 0 | 1;
  last_air_date?: string;
  last_episode_to_air?: number;
  next_episode_to_air?: number | null;
  network?: string | null;

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
    status?: string,
    type?: string,
    in_production?: 0 | 1,
    last_air_date?: string,
    last_episode_to_air?: number | null,
    next_episode_to_air?: number | null,
    network?: string | null,
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
    if (status) this.status = status;
    if (type) this.type = type;
    if (in_production !== undefined) this.in_production = in_production;
    if (last_air_date) this.last_air_date = last_air_date;
    if (last_episode_to_air) this.last_episode_to_air = last_episode_to_air;
    if (next_episode_to_air !== undefined) this.next_episode_to_air = next_episode_to_air;
    if (network !== undefined) this.network = network;
  }

  async save() {
    const query =
      'INSERT INTO shows (tmdb_id, title, description, release_date, image, user_rating, content_rating, season_count, episode_count, status, type, in_production, last_air_date, last_episode_to_air, next_episode_to_air, network) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
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
      this.status,
      this.type,
      this.in_production,
      this.last_air_date,
      this.last_episode_to_air,
      this.next_episode_to_air,
      this.network,
    ]);
    this.id = (result as any).insertId;
    this.genreIds?.map((genre_id) => this.saveGenre(this.id!, genre_id));
    this.streaming_services?.map((streaming_service_id) => this.saveStreamingService(this.id!, streaming_service_id));
  }

  async update() {
    const query =
      'UPDATE shows SET title = ?, description = ?, release_date = ?, image = ?, user_rating = ?, content_rating = ?, season_count = ?, episode_count = ?, status = ?, type = ?, in_production = ?, last_air_date = ?, last_episode_to_air = ?, next_episode_to_air = ?, network = ? WHERE tmdb_id = ?';
    await pool.execute(query, [
      this.title,
      this.description,
      this.release_date,
      this.image,
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
    this.genreIds?.forEach((genre_id) => this.saveGenre(this.id!, genre_id));
    this.streaming_services?.forEach((streaming_service_id) =>
      this.saveStreamingService(this.id!, streaming_service_id),
    );
  }

  async saveGenre(show_id: number, genre_id: number) {
    const query = 'INSERT IGNORE INTO tv_show_genres (show_id, genre_id) VALUES (?,?)';
    await pool.execute(query, [show_id, genre_id]);
  }

  async saveStreamingService(show_id: number, streaming_service_id: number) {
    const query = 'INSERT IGNORE INTO tv_show_services (show_id, streaming_service_id) VALUES (?, ?)';
    await pool.execute(query, [show_id, streaming_service_id]);
  }

  async saveFavorite(profile_id: string, save_children: boolean) {
    const query = 'INSERT IGNORE INTO show_watch_status (profile_id, show_id) VALUES (?,?)';
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

  async removeFavorite(profile_id: string) {
    const query = 'DELETE FROM show_watch_status WHERE profile_id = ? AND show_id = ?';
    await pool.execute(query, [profile_id, this.id]);
    const seasonQuery = 'SELECT id FROM seasons WHERE show_id = ?';
    const [rows] = await pool.execute(seasonQuery, [this.id]);
    const season_ids = rows as any[];
    season_ids.forEach((id) => {
      Season.removeFavorite(profile_id, id.id);
    });
  }

  static async findById(id: number): Promise<Show | null> {
    const query = `SELECT * FROM shows WHERE id = ?`;
    const [rows] = await pool.execute(query, [id]);
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
    const [rows] = await pool.execute<RowDataPacket[]>(query, [Number(profile_id)]);
    const transformedRows = rows.map(this.transformRow);
    return transformedRows;
  }

  static async getShowForProfile(profile_id: string, show_id: number) {
    const query = 'SELECT * FROM profile_shows where profile_id = ? AND show_id = ?';
    const [rows] = await pool.execute(query, [Number(profile_id), show_id]);
    const shows = rows as any[];
    return shows[0];
  }

  static async getShowWithSeasonsForProfile(profile_id: string, show_id: string) {
    const query = 'SELECT * FROM profile_shows where profile_id = ? AND show_id = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(query, [Number(profile_id), Number(show_id)]);
    const transformedRows = rows.map(this.transformRow);
    const show = transformedRows[0];
    const seasons = await Season.getSeasonsForShow(profile_id, show_id);
    show.seasons = seasons;
    return show;
  }

  static async getNextWatchForProfile(profile_id: string) {
    const query = 'SELECT * from profile_next_watch where profile_id = ? LIMIT 8';
    const [rows] = await pool.execute(query, [Number(profile_id)]);
    return rows;
  }

  static async getShowsForUpdates(): Promise<ContentUpdates[]> {
    const query = `SELECT id, title, tmdb_id, created_at, updated_at from shows where in_production = 1 AND status NOT IN ('Canceled', 'Ended')`;
    const [rows] = await pool.execute<RowDataPacket[]>(query);
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
  }

  async getProfilesForShow(): Promise<number[]> {
    const query = 'SELECT profile_id FROM show_watch_status where show_id = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(query, [this.id]);
    const profileIds = rows.map((row) => {
      return row.profile_id;
    });
    return profileIds;
  }

  private static transformRow(row: RowDataPacket) {
    const {
      last_episode_title,
      last_episode_air_date,
      last_episode_number,
      last_episode_season,
      next_episode_title,
      next_episode_air_date,
      next_episode_number,
      next_episode_season,
      seasons,
      ...rest
    } = row;

    return {
      ...rest,
      seasons,
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
