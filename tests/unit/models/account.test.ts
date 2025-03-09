import { CustomError, DatabaseError } from '@middleware/errorMiddleware';
import Account from '@models/account';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

jest.mock('@utils/db', () => {
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

  describe('register()', () => {
    test('should insert account and profile into DB', async () => {
      mockPool.execute
        .mockResolvedValueOnce([{ insertId: 1 } as ResultSetHeader])
        .mockResolvedValueOnce([{ insertId: 10 } as ResultSetHeader])
        .mockResolvedValueOnce([{}]);

      const account = new Account('John Doe', 'john@example.com', 'uid123');
      await account.register();

      expect(mockPool.execute).toHaveBeenCalledTimes(3);
      expect(mockPool.execute).toHaveBeenCalledWith(
        'INSERT INTO accounts (account_name, email, uid) VALUES (?, ?, ?)',
        ['John Doe', 'john@example.com', 'uid123'],
      );
      expect(account.account_id).toBe(1);
      expect(account.default_profile_id).toBe(10);
    });

    test('should throw CustomError when registration fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      const account = new Account('John Doe', 'john@example.com', 'uid123');

      try {
        await account.register();
        fail('Expected register to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
      }
    });
  });

  describe('updateAccountImage()', () => {
    test('should update account image', async () => {
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

    test('should return null when no rows affected', async () => {
      mockPool.execute.mockResolvedValueOnce([{ affectedRows: 0 } as ResultSetHeader]);

      const account = new Account('John Doe', 'john@example.com', 'uid123', undefined, 1, 10);
      const updatedAccount = await account.updateAccountImage('/path/to/image.jpg');

      expect(updatedAccount).toBeNull();
    });

    test('should throw CustomError when update fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      const account = new Account('John Doe', 'john@example.com', 'uid123', undefined, 1, 10);

      try {
        await account.updateAccountImage('/path/to/image.jpg');
        fail('Expected updateAccountImage to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
      }
    });
  });

  describe('editAccount()', () => {
    test('should update account details', async () => {
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

    test('should return null when no rows affected', async () => {
      mockPool.execute.mockResolvedValueOnce([{ affectedRows: 0 } as ResultSetHeader]);

      const account = new Account('John Doe', 'john@example.com', 'uid123', undefined, 1, 10);
      const updatedAccount = await account.editAccount('Jane Doe', 20);

      expect(updatedAccount).toBeNull();
    });

    test('should throw CustomError when update fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      const account = new Account('John Doe', 'john@example.com', 'uid123', undefined, 1, 10);

      try {
        await account.editAccount('Jane Doe', 20);
        fail('Expected editAccount to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
      }
    });
  });

  describe('findByUID()', () => {
    test('should return an account object', async () => {
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

    test('should return null when account not found', async () => {
      mockPool.execute.mockResolvedValueOnce([[] as RowDataPacket[]]);

      const account = await Account.findByUID('unknown-uid');

      expect(account).toBeNull();
    });

    test('should throw CustomError when query fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      try {
        await Account.findByUID('uid123');
        fail('Expected findByUID to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
      }
    });
  });

  describe('findByEmail()', () => {
    test('should return an account object', async () => {
      const mockAccount = {
        account_id: 1,
        account_name: 'John Doe',
        email: 'john@example.com',
        uid: 'uid123',
        image: null,
        default_profile_id: 10,
      };

      mockPool.execute.mockResolvedValueOnce([[mockAccount] as RowDataPacket[]]);

      const account = await Account.findByEmail('john@example.com');

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM accounts WHERE email = ?', ['john@example.com']);
      expect(account).not.toBeNull();
      expect(account?.account_id).toBe(1);
      expect(account?.account_name).toBe('John Doe');
    });

    test('should return null when account not found', async () => {
      mockPool.execute.mockResolvedValueOnce([[] as RowDataPacket[]]);

      const account = await Account.findByEmail('unknown@example.com');

      expect(account).toBeNull();
    });

    test('should throw CustomError when query fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      try {
        await Account.findByEmail('john@example.com');
        fail('Expected findByEmail to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
      }
    });
  });

  describe('findById()', () => {
    test('should return an account object', async () => {
      const mockAccount = {
        account_id: 1,
        account_name: 'John Doe',
        email: 'john@example.com',
        uid: 'uid123',
        image: null,
        default_profile_id: 10,
      };

      mockPool.execute.mockResolvedValueOnce([[mockAccount] as RowDataPacket[]]);

      const account = await Account.findById(1);

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM accounts WHERE account_id = ?', [1]);
      expect(account).not.toBeNull();
      expect(account?.account_id).toBe(1);
      expect(account?.account_name).toBe('John Doe');
    });

    test('should return null when account not found', async () => {
      mockPool.execute.mockResolvedValueOnce([[] as RowDataPacket[]]);

      const account = await Account.findById(999);

      expect(account).toBeNull();
    });

    test('should throw CustomError when query fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      try {
        await Account.findById(1);
        fail('Expected findById to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
      }
    });
  });

  describe('findAccountIdByProfileId()', () => {
    test('should return account ID', async () => {
      const mockProfile = {
        profile_id: 5,
        account_id: 1,
        name: 'Test Profile',
      };

      mockPool.execute.mockResolvedValueOnce([[mockProfile] as RowDataPacket[]]);

      const accountId = await Account.findAccountIdByProfileId('5');

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM profiles where profile_id = ?', ['5']);
      expect(accountId).toBe(1);
    });

    test('should return null when profile not found', async () => {
      mockPool.execute.mockResolvedValueOnce([[] as RowDataPacket[]]);

      const accountId = await Account.findAccountIdByProfileId('999');

      expect(accountId).toBeNull();
    });

    test('should throw CustomError when query fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      try {
        await Account.findAccountIdByProfileId('5');
        fail('Expected findAccountIdByProfileId to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
      }
    });
  });
});
