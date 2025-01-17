import pool from '../utils/db';

class Episode {
  id?: number;
  readonly tmdb_id: number;
  readonly show_id: number;
  readonly season_id: number;
  readonly episode_number: number;
  readonly episode_type: string;
  readonly season_number: number;
  readonly title: string;
  readonly overview: string;
  readonly air_date: string;
  readonly runtime: number;
  readonly image: string;

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
    image: string,
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
    this.image = image;
    if (id) this.id = id;
  }

  async save() {
    const query =
      'INSERT into episodes (tmdb_id, show_id, season_id, episode_number, episode_type, season_number, title, overview, air_date, runtime, image) VALUE (?,?,?,?,?,?,?,?,?,?,?)';
    const [result] = await pool.execute(query, [
      this.tmdb_id,
      this.show_id,
      this.season_id,
      this.episode_number,
      this.episode_type,
      this.season_number,
      this.title,
      this.overview,
      this.air_date,
      this.runtime,
      this.image,
    ]);
    this.id = (result as any).insertId;
  }

  async saveFavorite(profile_id: string) {
    const query = 'INSERT into episode_watch_status (profile_id, episode_id) VALUE (?,?)';
    await pool.execute(query, [Number(profile_id), this.id]);
  }

  static async saveFavorite(profile_id: string, episode_id: number) {
    const query = 'INSERT into episode_watch_status (profile_id, episode_id) VALUE (?,?)';
    await pool.execute(query, [Number(profile_id), episode_id]);
  }

  static async removeFavorite(profile_id: string, episode_id: number) {
    const query = 'DELETE FROM episode_watch_status WHERE profile_id = ? AND episode_id = ?';
    await pool.execute(query, [Number(profile_id), episode_id]);
  }

  static async updateWatchStatus(profile_id: string, episode_id: number, status: string): Promise<boolean> {
    const query = 'UPDATE episode_watch_status SET status = ? WHERE profile_id = ? AND episode_id = ?';
    const [result] = await pool.execute(query, [status, profile_id, episode_id]);
    if ((result as any).affectedRows === 0) return false;
    return true;
  }

  static async getEpisodesForSeason(profile_id: string, season_id: number) {
    const query = 'SELECT * FROM profile_episodes where profile_id = ? and season_id = ? ORDER BY episode_number';
    const [rows] = await pool.execute(query, [Number(profile_id), season_id]);
    return rows;
  }
}

export default Episode;
