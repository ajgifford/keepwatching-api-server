import pool from '../utils/db';

class Profile {
  account_id: number;
  name: string;
  id?: number;

  constructor(account_id: number, name: string, id?: number) {
    this.account_id = account_id;
    this.name = name;
    if (id) this.id = id;
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
    return new Profile(this.account_id, name, this.id);
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
    const query = `SELECT * FROM profiles WHERE account_id = ?`;
    const [rows] = await pool.execute(query, [account_id]);
    const profiles = rows as any[];
    return profiles.map((profile) => new Profile(profile.account_id, profile.name, profile.profile_id));
  }
}

export default Profile;
