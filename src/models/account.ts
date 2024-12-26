import db from '../utils/db';
import bcrypt from 'bcryptjs';

interface IAccount {
  id?: number;
  name: string;
  email: string;
  password: string;
  comparePassword: (enteredPassword: string) => Promise<boolean>;
}

class Account {
  id?: number;
  name: string;
  email: string;
  password: string;

  constructor(name: string, email: string, password: string, id?: number) {
    this.name = name;
    this.email = email;
    this.password = password;
    if (id) this.id = id;
  }

  async save() {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    const query = `INSERT INTO accounts (name, email, password) VALUES (?, ?, ?)`;
    const [result] = await db.execute(query, [this.name, this.email, hashedPassword]);
    this.id = (result as any).insertId;
  }

  static async findByEmail(email: string): Promise<Account | null> {
    const query = `SELECT * FROM accounts WHERE email = ?`;
    const [rows] = await db.execute(query, [email]);
    const accounts = rows as any[];
    if (accounts.length === 0) return null;
    const account = accounts[0];
    return new Account(account.name, account.email, account.password, account.id);
  }

  async comparePassword(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
  }
}

export default Account;
