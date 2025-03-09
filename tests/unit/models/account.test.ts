import { CustomError } from '@middleware/errorMiddleware';
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

    test('should throw error when registration fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      const account = new Account('John Doe', 'john@example.com', 'uid123');

      await expect(account.register()).rejects.toThrow('DB connection failed');
    });

    test('should throw error with default message when registration fails', async () => {
      mockPool.execute.mockRejectedValueOnce({});

      const account = new Account('John Doe', 'john@example.com', 'uid123');

      await expect(account.register()).rejects.toThrow('Unknown database error during registration');
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

    test('should throw error when update image fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      const account = new Account('John Doe', 'john@example.com', 'uid123', undefined, 1, 10);

      await expect(account.updateAccountImage('/path/to/image.jpg')).rejects.toThrow('DB connection failed');
    });

    test('should throw error with default message when update image fails', async () => {
      mockPool.execute.mockRejectedValueOnce({});

      const account = new Account('John Doe', 'john@example.com', 'uid123');

      await expect(account.updateAccountImage('image')).rejects.toThrow('Unknown database error during image update');
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

    test('should throw error when edit account fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      const account = new Account('John Doe', 'john@example.com', 'uid123', undefined, 1, 10);

      await expect(account.editAccount('Jane Doe', 20)).rejects.toThrow('DB connection failed');
    });

    test('should throw error with default message when edit account fails', async () => {
      mockPool.execute.mockRejectedValueOnce({});

      const account = new Account('John Doe', 'john@example.com', 'uid123');

      await expect(account.editAccount('Jane Doe', 23)).rejects.toThrow('Unknown database error during account edit');
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

    test('should throw error when find by UID fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      await expect(Account.findByUID('uid123')).rejects.toThrow('DB connection failed');
    });

    test('should throw error with default message when find by UID fails', async () => {
      mockPool.execute.mockRejectedValueOnce({});

      await expect(Account.findByUID('uid123')).rejects.toThrow('Unknown database error when finding account by UID');
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

    test('should throw error when find by email fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      await expect(Account.findByEmail('john@example.com')).rejects.toThrow('DB connection failed');
    });

    test('should throw error with default message when find by email fails', async () => {
      mockPool.execute.mockRejectedValueOnce({});

      await expect(Account.findByEmail('john@example.com')).rejects.toThrow(
        'Unknown database error when finding account by email',
      );
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

    test('should throw error when find by id fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      await expect(Account.findById(1)).rejects.toThrow('DB connection failed');
    });

    test('should throw error with default message when find by id fails', async () => {
      mockPool.execute.mockRejectedValueOnce({});

      await expect(Account.findById(1)).rejects.toThrow('Unknown database error when finding account by ID');
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

    test('should throw error when find by profile id fails', async () => {
      const mockError = new Error('DB connection failed');
      mockPool.execute.mockRejectedValueOnce(mockError);

      await expect(Account.findAccountIdByProfileId('5')).rejects.toThrow('DB connection failed');
    });

    test('should throw error with default message when find by profile id fails', async () => {
      mockPool.execute.mockRejectedValueOnce({});

      await expect(Account.findAccountIdByProfileId('5')).rejects.toThrow(
        'Unknown database error when finding account ID by profile ID',
      );
    });
  });
});
