import { DatabaseError } from '@middleware/errorMiddleware';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * Represents a user profile associated with an account
 * 
 * The Profile class handles user profiles, which are used to track preferences,
 * watched content, and favorites for different users sharing the same account.
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
   * 
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
   * 
   * This method inserts a new profile record associated with an account.
   * After successful insertion, the profile's id property is updated with the new database ID.
   *
   * @returns {Promise<void>} A promise that resolves when the profile has been saved
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Create a new profile for account ID 123
   * const profile = new Profile(123, 'Family Profile');
   * 
   * try {
   *   await profile.save();
   *   console.log(`Profile created with ID: ${profile.id}`);
   * } catch (error) {
   *   console.error('Error creating profile:', error);
   * }
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
   * 
   * This method updates the name of a profile in the database.
   *
   * @param {string} name - New name for the profile
   * @returns {Promise<Profile | null>} Updated profile object or null if update failed
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get an existing profile
   * const profile = await Profile.findById(456);
   * 
   * if (profile) {
   *   // Update the profile name
   *   const updatedProfile = await profile.update('New Profile Name');
   *   
   *   if (updatedProfile) {
   *     console.log(`Profile renamed to: ${updatedProfile.name}`);
   *   } else {
   *     console.log('Profile update failed');
   *   }
   * }
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
   * 
   * This method updates the image path for a profile in the database.
   *
   * @param {string} imagePath - Path to the new profile image
   * @returns {Promise<Profile | null>} Updated profile object or null if update failed
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get an existing profile
   * const profile = await Profile.findById(456);
   * 
   * if (profile) {
   *   // Update the profile image
   *   const updatedProfile = await profile.updateProfileImage('/path/to/new_image.jpg');
   *   
   *   if (updatedProfile) {
   *     console.log('Profile image updated successfully');
   *   } else {
   *     console.log('Profile image update failed');
   *   }
   * }
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
   * 
   * This method removes a profile and its associated data from the database.
   * Note: This will also cascade delete all watch status data for the profile.
   *
   * @returns {Promise<boolean>} True if profile was successfully deleted, false otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * // Get an existing profile
   * const profile = await Profile.findById(456);
   * 
   * if (profile) {
   *   // Delete the profile
   *   const deleted = await profile.delete();
   *   
   *   if (deleted) {
   *     console.log('Profile deleted successfully');
   *   } else {
   *     console.log('Profile deletion failed');
   *   }
   * }
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
   * Finds a profile by its database ID
   * 
   * This static method searches for a profile with the specified ID.
   *
   * @param {number} id - ID of the profile to find
   * @returns {Promise<Profile | null>} Profile object if found, null otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   // Find profile with ID 456
   *   const profile = await Profile.findById(456);
   *   
   *   if (profile) {
   *     console.log(`Found profile: ${profile.name} (Account ID: ${profile.account_id})`);
   *   } else {
   *     console.log('Profile not found');
   *   }
   * } catch (error) {
   *   console.error('Error finding profile:', error);
   * }
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
   * 
   * This static method returns all profiles belonging to a specific account.
   *
   * @param {number} accountId - ID of the account to get profiles for
   * @returns {Promise<Profile[]>} Array of profiles belonging to the account
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   // Get all profiles for account 123
   *   const profiles = await Profile.getAllByAccountId(123);
   *   
   *   console.log(`Found ${profiles.length} profiles for account 123:`);
   *   profiles.forEach(profile => {
   *     console.log(`- ${profile.name} (ID: ${profile.id})`);
   *   });
   * } catch (error) {
   *   console.error('Error retrieving profiles:', error);
   * }
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
