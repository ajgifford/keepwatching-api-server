import pool from '../utils/db';

class Profile {
  id?: number;
  account_id: number;
  name: string;
  showsToWatch?: number = 0;
  showsWatching?: number = 0;
  showsWatched?: number = 0;
  moviesToWatch?: number = 0;
  moviesWatched?: number = 0;

  constructor(
    account_id: number,
    name: string,
    id?: number,
    showsToWatch?: number,
    showsWatching?: number,
    showsWacthed?: number,
    moviesToWatch?: number,
    movesWatched?: number,
  ) {
    this.account_id = account_id;
    this.name = name;
    if (id) this.id = id;
    if (showsToWatch) this.showsToWatch = showsToWatch;
    if (showsWatching) this.showsWatching = showsWatching;
    if (showsWacthed) this.showsWatched = showsWacthed;
    if (moviesToWatch) this.moviesToWatch = moviesToWatch;
    if (movesWatched) this.moviesWatched = movesWatched;
  }

  async save() {
    const query = 'INSERT into profiles (account_id, name) VALUES (?, ?)';
    const [result] = await pool.execute(query, [this.account_id, this.name]);
    this.id = (result as any).insertId;
  }

  async update(name: string): Promise<Profile | null> {
    const query = 'UPDATE profiles SET name = ? WHERE profile_id = ?';
    const [result] = await pool.execute(query, [name, this.id]);
    if ((result as any).affectedRows === 0) return null;
    return new Profile(
      this.account_id,
      name,
      this.id,
      this.showsToWatch,
      this.showsWatching,
      this.showsWatched,
      this.moviesToWatch,
      this.moviesWatched,
    );
  }

  async delete(id: number) {
    const query = 'DELETE FROM profiles WHERE profile_id = ?';
    const [result] = await pool.execute(query, [id]);
    return (result as any).affectedRows;
  }

  static async findById(id: number): Promise<Profile | null> {
    const query = `SELECT * FROM profiles WHERE profile_id = ?`;
    const [rows] = await pool.execute(query, [id]);
    const profiles = rows as any[];
    if (profiles.length === 0) return null;
    const profile = profiles[0];
    return new Profile(profile.account_id, profile.name, profile.profile_id);
  }

  static async getAllByAccountId(account_id: number): Promise<Profile[]> {
    const query = `SELECT * FROM profile_watch_counts WHERE account_id = ?`;
    const [rows] = await pool.execute(query, [account_id]);
    const profiles = rows as any[];
    return profiles.map(
      (profile) =>
        new Profile(
          profile.account_id,
          profile.profile_name,
          profile.profile_id,
          profile.show_not_watched_count,
          profile.show_watching_count,
          profile.show_watched_count,
          profile.movie_not_watched_count,
          profile.movie_watched_count,
        ),
    );
  }
}

export default Profile;
