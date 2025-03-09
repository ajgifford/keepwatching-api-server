import { ProfileEpisode } from '../types/showTypes';
import { DatabaseError } from '@middleware/errorMiddleware';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

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
  readonly still_image: string;

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

  async saveFavorite(profile_id: number): Promise<void> {
    try {
      const query = 'INSERT IGNORE INTO episode_watch_status (profile_id, episode_id) VALUES (?,?)';
      await getDbPool().execute(query, [Number(profile_id), this.id]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error saving an episode as a favorite';
      throw new DatabaseError(errorMessage, error);
    }
  }

  static async saveFavorite(profile_id: string, episode_id: number): Promise<void> {
    try {
      const query = 'INSERT IGNORE INTO episode_watch_status (profile_id, episode_id) VALUES (?,?)';
      await getDbPool().execute(query, [Number(profile_id), episode_id]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error saving an episode as a favorite';
      throw new DatabaseError(errorMessage, error);
    }
  }

  static async removeFavorite(profile_id: string, episode_id: number): Promise<void> {
    try {
      const query = 'DELETE FROM episode_watch_status WHERE profile_id = ? AND episode_id = ?';
      await getDbPool().execute(query, [Number(profile_id), episode_id]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error removing an episode as a favorite';
      throw new DatabaseError(errorMessage, error);
    }
  }

  static async updateWatchStatus(profile_id: string, episode_id: number, status: string): Promise<boolean> {
    try {
      const query = 'UPDATE episode_watch_status SET status = ? WHERE profile_id = ? AND episode_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [status, profile_id, episode_id]);

      // Return true if at least one row was affected (watch status was updated)
      return result.affectedRows > 0;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error updating an episode watch status';
      throw new DatabaseError(errorMessage, error);
    }
  }

  static async getEpisodesForSeason(profile_id: string, season_id: number): Promise<ProfileEpisode[]> {
    try {
      const query = 'SELECT * FROM profile_episodes where profile_id = ? and season_id = ? ORDER BY episode_number';
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [Number(profile_id), season_id]);
      return rows as ProfileEpisode[];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error getting episodes for a season';
      throw new DatabaseError(errorMessage, error);
    }
  }
}

export default Episode;
