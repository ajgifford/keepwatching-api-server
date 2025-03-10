import { DatabaseError } from '@middleware/errorMiddleware';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * Interface representing the structure of an Account entity
 */
export interface IAccount {
  /** Unique identifier for the account (optional, set after saving to database) */
  account_id?: number;
  /** Display name of the account owner */
  account_name: string;
  /** Email address associated with the account */
  email: string;
  /** External authentication provider's unique ID (e.g., Firebase UID) */
  uid: string;
  /** Path to the account's profile image (optional) */
  image?: string;
  /** ID of the profile marked as default for this account (optional) */
  default_profile_id?: number;
}

/**
 * Represents a user account with authentication info and profile management
 * 
 * The Account class manages user accounts and their relationship with profiles,
 * handling operations like registration, finding accounts, and updating account details.
 * @class Account
 * @implements IAccount
 */
class Account implements IAccount {
  /** Unique identifier for the account (optional, set after saving to database) */
  account_id?: number;
  /** Display name of the account owner */
  account_name: string;
  /** Email address associated with the account */
  email: string;
  /** External authentication provider's unique ID (e.g., Firebase UID) */
  uid: string;
  /** Path to the account's profile image (optional) */
  image?: string;
  /** ID of the profile marked as default for this account (optional) */
  default_profile_id?: number;

  /**
   * Creates a new Account instance
   * @param {string} name - Display name of the account owner
   * @param {string} email - Email address associated with the account
   * @param {string} uid - External authentication provider's unique ID
   * @param {string} [image] - Optional path to the account's profile image
   * @param {number} [account_id] - Optional ID for an existing account
   * @param {number} [default_profile_id] - Optional ID of the default profile
   */
  constructor(
    name: string,
    email: string,
    uid: string,
    image?: string,
    account_id?: number,
    default_profile_id?: number,
  ) {
    this.account_name = name;
    this.email = email;
    this.uid = uid;
    if (image) this.image = image;
    if (account_id) this.account_id = account_id;
    if (default_profile_id) this.default_profile_id = default_profile_id;
  }

  /**
   * Registers a new account and creates an initial profile
   * 
   * This method creates a new account record in the database, then creates an initial profile
   * with the same name as the account, and sets that profile as the default profile.
   *
   * @returns {Promise<void>} A promise that resolves when registration is complete
   * @throws {DatabaseError} If a database error occurs during registration
   *
   * @example
   * const newAccount = new Account('John Doe', 'john@example.com', 'firebase-uid-123');
   * await newAccount.register();
   * console.log(`Account created with ID: ${newAccount.account_id}`);
   * console.log(`Default profile created with ID: ${newAccount.default_profile_id}`);
   */
  async register(): Promise<void> {
    try {
      const query = `INSERT INTO accounts (account_name, email, uid) VALUES (?, ?, ?)`;
      const pool = getDbPool();
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [this.account_name, this.email, this.uid]);
      this.account_id = result.insertId;

      const profileQuery = 'INSERT INTO profiles (account_id, name) VALUES (?,?)';
      const [profileResult] = await pool.execute<ResultSetHeader>(profileQuery, [this.account_id, this.account_name]);
      this.default_profile_id = profileResult.insertId;

      const defaultQuery = 'UPDATE accounts SET default_profile_id = ? WHERE account_id = ?';
      await pool.execute(defaultQuery, [this.default_profile_id, this.account_id]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error during registration';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Updates the account's profile image
   * 
   * This method updates the image path for the account in the database.
   *
   * @param {string} imagePath - Path to the new image file
   * @returns {Promise<Account | null>} Updated account object or null if update failed
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * const account = await Account.findById(1);
   * if (account) {
   *   const updatedAccount = await account.updateAccountImage('path/to/new/image.jpg');
   *   if (updatedAccount) {
   *     console.log('Account image updated successfully');
   *   } else {
   *     console.log('Failed to update account image');
   *   }
   * }
   */
  async updateAccountImage(imagePath: string): Promise<Account | null> {
    try {
      const query = 'UPDATE accounts SET image = ? WHERE account_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [imagePath, this.account_id]);

      if (result.affectedRows === 0) return null;

      return new Account(this.account_name, this.email, this.uid, imagePath, this.account_id, this.default_profile_id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error during image update';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Updates the account details including name and default profile
   * 
   * This method updates the account name and default profile ID in the database.
   *
   * @param {string} accountName - New display name for the account
   * @param {number} defaultProfileId - ID of the profile to set as default
   * @returns {Promise<Account | null>} Updated account object or null if update failed
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * const account = await Account.findById(1);
   * if (account) {
   *   const updatedAccount = await account.editAccount('New Name', 2);
   *   if (updatedAccount) {
   *     console.log(`Account updated: ${updatedAccount.account_name}, Default Profile: ${updatedAccount.default_profile_id}`);
   *   } else {
   *     console.log('Failed to update account');
   *   }
   * }
   */
  async editAccount(accountName: string, defaultProfileId: number): Promise<Account | null> {
    try {
      const query = 'UPDATE accounts SET account_name = ?, default_profile_id = ? WHERE account_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [
        accountName,
        defaultProfileId,
        this.account_id,
      ]);

      if (result.affectedRows === 0) return null;

      return new Account(accountName, this.email, this.uid, this.image, this.account_id, defaultProfileId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error during account edit';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Finds an account by external provider UID (e.g., Firebase UID)
   * 
   * This static method searches for an account with the specified UID.
   *
   * @param {string} uid - External provider's unique ID to search for
   * @returns {Promise<Account | null>} Account object if found, null otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   const account = await Account.findByUID('firebase-uid-123');
   *   if (account) {
   *     console.log(`Found account: ${account.account_name} (${account.email})`);
   *   } else {
   *     console.log('Account not found');
   *   }
   * } catch (error) {
   *   console.error('Error finding account:', error);
   * }
   */
  static async findByUID(uid: string): Promise<Account | null> {
    try {
      const query = `SELECT * FROM accounts WHERE uid = ?`;
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [uid]);

      if (rows.length === 0) return null;

      const account = rows[0];
      return new Account(
        account.account_name,
        account.email,
        account.uid,
        account.image,
        account.account_id,
        account.default_profile_id,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error when finding account by UID';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Finds an account by email address
   * 
   * This static method searches for an account with the specified email address.
   *
   * @param {string} email - Email address to search for
   * @returns {Promise<Account | null>} Account object if found, null otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   const account = await Account.findByEmail('john@example.com');
   *   if (account) {
   *     console.log(`Found account: ${account.account_name} (ID: ${account.account_id})`);
   *   } else {
   *     console.log('No account found with this email');
   *   }
   * } catch (error) {
   *   console.error('Error finding account:', error);
   * }
   */
  static async findByEmail(email: string): Promise<Account | null> {
    try {
      const query = `SELECT * FROM accounts WHERE email = ?`;
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [email]);

      if (rows.length === 0) return null;

      const account = rows[0];
      return new Account(
        account.account_name,
        account.email,
        account.uid,
        account.image,
        account.account_id,
        account.default_profile_id,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error when finding account by email';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Finds an account by its database ID
   * 
   * This static method searches for an account with the specified ID.
   *
   * @param {number} id - Account ID to search for
   * @returns {Promise<Account | null>} Account object if found, null otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   const account = await Account.findById(123);
   *   if (account) {
   *     console.log(`Found account: ${account.account_name} (${account.email})`);
   *   } else {
   *     console.log('No account found with this ID');
   *   }
   * } catch (error) {
   *   console.error('Error finding account:', error);
   * }
   */
  static async findById(id: number): Promise<Account | null> {
    try {
      const query = `SELECT * FROM accounts WHERE account_id = ?`;
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [id]);

      if (rows.length === 0) return null;

      const account = rows[0];
      return new Account(
        account.account_name,
        account.email,
        account.uid,
        account.image,
        account.account_id,
        account.default_profile_id,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error when finding account by ID';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Finds the account ID associated with a specific profile
   * 
   * This static method looks up which account owns a given profile.
   *
   * @param {string} profileId - Profile ID to search for
   * @returns {Promise<number | null>} Account ID if found, null otherwise
   * @throws {DatabaseError} If a database error occurs during the operation
   *
   * @example
   * try {
   *   const accountId = await Account.findAccountIdByProfileId('456');
   *   if (accountId) {
   *     console.log(`Profile belongs to account ID: ${accountId}`);
   *   } else {
   *     console.log('No account found for this profile');
   *   }
   * } catch (error) {
   *   console.error('Error finding account for profile:', error);
   * }
   */
  static async findAccountIdByProfileId(profileId: string): Promise<number | null> {
    try {
      const query = `SELECT * FROM profiles where profile_id = ?`;
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [profileId]);

      if (rows.length === 0) return null;

      const profile = rows[0];
      return profile.account_id;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error when finding account ID by profile ID';
      throw new DatabaseError(errorMessage, error);
    }
  }
}

export default Account;
