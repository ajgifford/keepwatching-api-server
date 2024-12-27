import pool from '../utils/db';
import bcrypt from 'bcryptjs';

interface IAccount {
  id?: number;
  account_name: string;
  email: string;
  password_hash: string;
  comparePassword: (enteredPassword: string) => Promise<boolean>;
}

class Account {
  id?: number;
  account_name: string;
  email: string;
  password_hash: string;

  constructor(name: string, email: string, password: string, id?: number) {
    this.account_name = name;
    this.email = email;
    this.password_hash = password;
    if (id) this.id = id;
  }

  async save() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password_hash, salt);
    const query = `INSERT INTO accounts (account_name, email, password_hash) VALUES (?, ?, ?)`;
    const [result] = await pool.execute(query, [this.account_name, this.email, hashedPassword]);
    this.id = (result as any).insertId;
  }

  static async findByEmail(email: string): Promise<Account | null> {
    const query = `SELECT * FROM accounts WHERE email = ?`;
    const [rows] = await pool.execute(query, [email]);
    const accounts = rows as any[];
    if (accounts.length === 0) return null;
    const account = accounts[0];
    return new Account(account.account_name, account.email, account.password_hash, account.account_id);
  }

  static async findById(id: number): Promise<Account | null> {
    const query = `SELECT * FROM accounts WHERE id = ?`;
    const [rows] = await pool.execute(query, [id]);
    const accounts = rows as any[];
    if (accounts.length === 0) return null;
    const account = accounts[0];
    return new Account(account.account_name, account.email, account.password_hash, account.id);
  }

  async comparePassword(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password_hash);
  }
}

export default Account;
