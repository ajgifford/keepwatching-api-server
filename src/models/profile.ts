import { DatabaseError } from '@middleware/errorMiddleware';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

class Profile {
  account_id: number;
  name: string;
  id?: number;
  image?: string;

  constructor(account_id: number, name: string, id?: number, image?: string) {
    this.account_id = account_id;
    this.name = name;
    if (id) this.id = id;
    if (image) this.image = image;
  }

  async save(): Promise<void> {
    try {
      const query = 'INSERT into profiles (account_id, name) VALUES (?, ?)';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [this.account_id, this.name]);
      this.id = result.insertId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error saving a profile';
      throw new DatabaseError(errorMessage, error);
    }
  }

  async update(name: string): Promise<Profile | null> {
    try {
      const query = 'UPDATE profiles SET name = ? WHERE profile_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [name, this.id]);

      if (result.affectedRows === 0) return null;

      return new Profile(this.account_id, name, this.id, this.image);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error updating a profile';
      throw new DatabaseError(errorMessage, error);
    }
  }

  async updateProfileImage(image_path: string): Promise<Profile | null> {
    try {
      const query = 'UPDATE profiles SET image = ? WHERE profile_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [image_path, this.id]);

      if (result.affectedRows === 0) return null;

      return new Profile(this.account_id, this.name, this.id, image_path);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error updating a profile image';
      throw new DatabaseError(errorMessage, error);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const query = 'DELETE FROM profiles WHERE profile_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [id]);

      return result.affectedRows > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error deleting a profile';
      throw new DatabaseError(errorMessage, error);
    }
  }

  static async findById(id: number): Promise<Profile | null> {
    try {
      const query = `SELECT * FROM profiles WHERE profile_id = ?`;
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [id]);

      if (rows.length === 0) return null;

      const profile = rows[0];
      return new Profile(profile.account_id, profile.name, profile.profile_id, profile.image);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error finding a profile by id';
      throw new DatabaseError(errorMessage, error);
    }
  }

  static async getAllByAccountId(account_id: number): Promise<Profile[]> {
    try {
      const query = `SELECT * FROM profiles WHERE account_id = ?`;
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [account_id]);

      return rows.map((profile) => new Profile(profile.account_id, profile.name, profile.profile_id, profile.image));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error getting all profiles by account';
      throw new DatabaseError(errorMessage, error);
    }
  }
}

export default Profile;
