import Account from '../src/models/account';
import { getDbPool } from '../src/utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Mock the database pool
jest.mock('../src/utils/db', () => {
  const mockPool = {
    execute: jest.fn(),
  };
  return {
    getDbPool: jest.fn(() => mockPool),
  };
});

describe('Account class', () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = getDbPool();
    mockPool.execute.mockReset();
  });

  test('register() should insert account and profile into DB', async () => {
    mockPool.execute
      .mockResolvedValueOnce([{ insertId: 1 } as ResultSetHeader]) // Mock account insert
      .mockResolvedValueOnce([{ insertId: 10 } as ResultSetHeader]) // Mock profile insert
      .mockResolvedValueOnce([{}]); // Mock update query

    const account = new Account('John Doe', 'john@example.com', 'uid123');
    await account.register();

    expect(mockPool.execute).toHaveBeenCalledTimes(3);
    expect(mockPool.execute).toHaveBeenCalledWith('INSERT INTO accounts (account_name, email, uid) VALUES (?, ?, ?)', [
      'John Doe',
      'john@example.com',
      'uid123',
    ]);
    expect(account.account_id).toBe(1);
    expect(account.default_profile_id).toBe(10);
  });

  test('findByUID() should return an account object', async () => {
    const mockAccount = {
      account_id: 1,
      account_name: 'John Doe',
      email: 'john@example.com',
      uid: 'uid123',
      image: null,
      default_profile_id: 10,
    };

    mockPool.execute.mockResolvedValueOnce([[mockAccount] as RowDataPacket[]]);

    const account = await Account.findByUID('uid123');

    expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM accounts WHERE uid = ?', ['uid123']);
    expect(account).not.toBeNull();
    expect(account?.account_id).toBe(1);
    expect(account?.account_name).toBe('John Doe');
  });

  test('updateAccountImage() should update account image', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]);

    const account = new Account('John Doe', 'john@example.com', 'uid123', undefined, 1, 10);
    const updatedAccount = await account.updateAccountImage('/path/to/image.jpg');

    expect(mockPool.execute).toHaveBeenCalledWith('UPDATE accounts SET image = ? WHERE account_id = ?', [
      '/path/to/image.jpg',
      1,
    ]);
    expect(updatedAccount).not.toBeNull();
    expect(updatedAccount?.image).toBe('/path/to/image.jpg');
  });

  test('editAccount() should update account details', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]);

    const account = new Account('John Doe', 'john@example.com', 'uid123', undefined, 1, 10);
    const updatedAccount = await account.editAccount('Jane Doe', 20);

    expect(mockPool.execute).toHaveBeenCalledWith(
      'UPDATE accounts SET account_name = ?, default_profile_id = ? WHERE account_id = ?',
      ['Jane Doe', 20, 1],
    );
    expect(updatedAccount).not.toBeNull();
    expect(updatedAccount?.account_name).toBe('Jane Doe');
    expect(updatedAccount?.default_profile_id).toBe(20);
  });
});
