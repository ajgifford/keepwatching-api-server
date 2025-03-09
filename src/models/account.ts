import { DatabaseError } from '@middleware/errorMiddleware';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IAccount {
  account_id?: number;
  account_name: string;
  email: string;
  uid: string;
  image?: string;
  default_profile_id?: number;
}

class Account implements IAccount {
  account_id?: number;
  account_name: string;
  email: string;
  uid: string;
  image?: string;
  default_profile_id?: number;

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
   * Register a new account and create an initial profile
   * @returns {Promise<void>}
   * @throws {DatabaseError} If there's an error during the database operation
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
   * Update account image
   * @param {string} image_path - Path to the image file
   * @returns {Promise<Account | null>} - Updated account or null if update failed
   * @throws {DatabaseError} If there's an error during the database operation
   */
  async updateAccountImage(image_path: string): Promise<Account | null> {
    try {
      const query = 'UPDATE accounts SET image = ? WHERE account_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [image_path, this.account_id]);

      if (result.affectedRows === 0) return null;

      return new Account(this.account_name, this.email, this.uid, image_path, this.account_id, this.default_profile_id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error during image update';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Edit account details
   * @param {string} account_name - New account name
   * @param {number} default_profile_id - New default profile ID
   * @returns {Promise<Account | null>} - Updated account or null if update failed
   * @throws {DatabaseError} If there's an error during the database operation
   */
  async editAccount(account_name: string, default_profile_id: number): Promise<Account | null> {
    try {
      const query = 'UPDATE accounts SET account_name = ?, default_profile_id = ? WHERE account_id = ?';
      const [result] = await getDbPool().execute<ResultSetHeader>(query, [
        account_name,
        default_profile_id,
        this.account_id,
      ]);

      if (result.affectedRows === 0) return null;

      return new Account(account_name, this.email, this.uid, this.image, this.account_id, default_profile_id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error during account edit';
      throw new DatabaseError(errorMessage, error);
    }
  }

  /**
   * Find account by UID
   * @param {string} uid - Firebase UID
   * @returns {Promise<Account | null>} - Account or null if not found
   * @throws {DatabaseError} If there's an error during the database operation
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
   * Find account by email
   * @param {string} email - Email address
   * @returns {Promise<Account | null>} - Account or null if not found
   * @throws {DatabaseError} If there's an error during the database operation
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
   * Find account by ID
   * @param {number} id - Account ID
   * @returns {Promise<Account | null>} - Account or null if not found
   * @throws {DatabaseError} If there's an error during the database operation
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
   * Find account ID by profile ID
   * @param {string} profile_id - Profile ID
   * @returns {Promise<number | null>} - Account ID or null if not found
   * @throws {DatabaseError} If there's an error during the database operation
   */
  static async findAccountIdByProfileId(profile_id: string): Promise<number | null> {
    try {
      const query = `SELECT * FROM profiles where profile_id = ?`;
      const [rows] = await getDbPool().execute<RowDataPacket[]>(query, [profile_id]);

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
