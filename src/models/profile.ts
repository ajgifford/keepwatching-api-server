import { DatabaseError } from '@middleware/errorMiddleware';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * Represents a user profile associated with an account
 * @class Profile
 */
class Profile {
  /** ID of the account that owns this profile */
  account_id: number;
  /** Name of the profile */
  name: string;
  /** Unique identifier for the profile (optional, set after saving to database) */
  id?: number;
  /** Path to the profile image (optional) */
  image?: string;

  /**
   * Creates a new Profile instance
   * @param {number} account_id - ID of the account that owns this profile
   * @param {string} name - Name of the profile
   * @param {number} [id] - Optional ID for an existing profile
   * @param {string} [image] - Optional path to the profile image
   */
  constructor(account_id: number, name: string, id?: number, image?: string) {
    this.account_id = account_id;
    this.name = name;
    if (id) this.id = id;
    if (image) this.image = image;
  }

  /**
   * Saves a new profile to the database
   * @returns {Promise<void>}
   * @throws {DatabaseError} If a database error occurs during the operation
   */
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

  /**
   * Updates an existing profile's name
   * @param {string} name - New name for the profile
   * @returns {Promise<Profile | null>} Updated profile object or null if update failed
   * @throws {DatabaseError} If a database error occurs during the operation
   */
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

  /**
   * Updates a profile's image
   * @param {string} imagePath - Path to the new profile image
   * @returns {Promise<Profile | null>} Updated profile object or null if update failed
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async updateProfileImage(imagePath: string): Promise<Profile | null> {
    try {
      const query = 'UPDATE profiles SET image = ? WHERE profile_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [imagePath, this.id]);

      if (result.affectedRows === 0) return null;

      return new Profile(this.account_id, this.name, this.id, imagePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error updating a profile image';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Deletes the profile from the database
   * @returns {Promise<boolean>} True if profile was successfully deleted, false otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  async delete(): Promise<boolean> {
    try {
      const query = 'DELETE FROM profiles WHERE profile_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [this.id]);

      return result.affectedRows > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error deleting a profile';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Finds a profile by its ID
   * @param {number} id - ID of the profile to find
   * @returns {Promise<Profile | null>} Profile object if found, null otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   */
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

  /**
   * Retrieves all profiles associated with an account
   * @param {number} accountId - ID of the account to get profiles for
   * @returns {Promise<Profile[]>} Array of profiles belonging to the account
   * @throws {DatabaseError} If a database error occurs during the operation
   */
  static async getAllByAccountId(accountId: number): Promise<Profile[]> {
    try {
      const query = `SELECT * FROM profiles WHERE account_id = ?`;
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [accountId]);

      return rows.map((profile) => new Profile(profile.account_id, profile.name, profile.profile_id, profile.image));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error getting all profiles by account';
      throw new DatabaseError(errorMessage, error);
    }
  }
}

export default Profile;
