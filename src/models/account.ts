import pool from '../utils/db';

interface IAccount {
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

  async register() {
    const query = `INSERT INTO accounts (account_name, email, uid) VALUES (?, ?, ?)`;
    const [result] = await pool.execute(query, [this.account_name, this.email, this.uid]);
    this.account_id = (result as any).insertId;
    const profileQuery = 'INSERT INTO profiles (account_id, name) VALUES (?,?)';
    const [profileResult] = await pool.execute(profileQuery, [this.account_id, this.account_name]);
    this.default_profile_id = (profileResult as any).insertId;
    const defaultQuery = 'UPDATE accounts SET default_profile_id = ? WHERE account_id = ?';
    await pool.execute(defaultQuery, [this.default_profile_id, this.account_id]);
  }

  async updateAccountImage(image_path: string) {
    const query = 'UPDATE accounts SET image = ? WHERE account_id = ?';
    const [result] = await pool.execute(query, [image_path, this.account_id]);
    if ((result as any).affectedRows === 0) return null;
    return new Account(this.account_name, this.email, this.uid, image_path, this.account_id, this.default_profile_id);
  }

  async editAccount(account_name: string, default_profile_id: number) {
    const query = 'UPDATE accounts SET account_name = ?, default_profile_id = ? WHERE account_id = ?';
    const [result] = await pool.execute(query, [account_name, default_profile_id, this.account_id]);
    if ((result as any).affectedRows === 0) return null;
    return new Account(account_name, this.email, this.uid, this.image, this.account_id, default_profile_id);
  }

  async editEmail(new_email: string) {
    const query = 'UPDATE accounts SET email = ? WHERE account_id = ?';
    const [result] = await pool.execute(query, [new_email, this.account_id]);
    if ((result as any).affectedRows === 0) return null;
    return new Account(this.account_name, new_email, this.uid, this.image, this.account_id, this.default_profile_id);
  }

  static async findByUID(uid: string): Promise<Account | null> {
    const query = `SELECT * FROM accounts WHERE uid = ?`;
    const [rows] = await pool.execute(query, [uid]);
    const accounts = rows as any[];
    if (accounts.length === 0) return null;
    const account = accounts[0];
    return new Account(
      account.account_name,
      account.email,
      account.uid,
      account.image,
      account.account_id,
      account.default_profile_id,
    );
  }

  static async findByEmail(email: string): Promise<Account | null> {
    const query = `SELECT * FROM accounts WHERE email = ?`;
    const [rows] = await pool.execute(query, [email]);
    const accounts = rows as any[];
    if (accounts.length === 0) return null;
    const account = accounts[0];
    return new Account(
      account.account_name,
      account.email,
      account.uid,
      account.image,
      account.account_id,
      account.default_profile_id,
    );
  }

  static async findById(id: number): Promise<Account | null> {
    const query = `SELECT * FROM accounts WHERE account_id = ?`;
    const [rows] = await pool.execute(query, [id]);
    const accounts = rows as any[];
    if (accounts.length === 0) return null;
    const account = accounts[0];
    return new Account(
      account.account_name,
      account.email,
      account.uid,
      account.image,
      account.account_id,
      account.default_profile_id,
    );
  }

  static async findAccountIdByProfileId(profile_id: string): Promise<number | null> {
    const query = `SELECT * FROM profiles where profile_id = ?`;
    const [rows] = await pool.execute(query, [profile_id]);
    const profiles = rows as any[];
    if (profiles.length === 0) return null;
    const profile = profiles[0];
    return profile.account_id;
  }
}

export default Account;
