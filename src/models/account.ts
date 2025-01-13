import pool from '../utils/db';
import bcrypt from 'bcryptjs';

interface IAccount {
  account_id?: number;
  account_name: string;
  email: string;
  password_hash: string;
  image?: string;
  default_profile_id?: number;
  comparePassword: (enteredPassword: string) => Promise<boolean>;
}

class Account implements IAccount {
  account_id?: number;
  account_name: string;
  email: string;
  password_hash: string;
  image?: string;
  default_profile_id?: number;

  constructor(
    name: string,
    email: string,
    password: string,
    image?: string,
    account_id?: number,
    default_profile_id?: number,
  ) {
    this.account_name = name;
    this.email = email;
    this.password_hash = password;
    if (image) this.image = image;
    if (account_id) this.account_id = account_id;
    if (default_profile_id) this.default_profile_id = default_profile_id;
  }

  async register() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password_hash, salt);
    const query = `INSERT INTO accounts (account_name, email, password_hash) VALUES (?, ?, ?)`;
    const [result] = await pool.execute(query, [this.account_name, this.email, hashedPassword]);
    this.account_id = (result as any).insertId;
    const profileQuery = 'INSERT INTO profiles (account_id, name) VALUES (?,?)';
    const [profileResult] = await pool.execute(profileQuery, [this.account_id, this.account_name]);
    this.default_profile_id = (profileResult as any).insertId;
  }

  async updateProfileImage(image_path: string) {
    const query = 'UPDATE accounts SET image = ? WHERE account_id = ?';
    const [result] = await pool.execute(query, [image_path, this.account_id]);
    if ((result as any).affectedRows === 0) return null;
    return new Account(
      this.account_name,
      this.email,
      this.password_hash,
      image_path,
      this.account_id,
      this.default_profile_id,
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
      account.password_hash,
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
      account.password_hash,
      account.image,
      account.account_id,
      account.default_profile_id,
    );
  }

  async comparePassword(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password_hash);
  }
}

export default Account;
