import { cliLogger, httpLogger } from '@logger/logger';
import { CustomError } from '@middleware/errorMiddleware';
import Account from '@models/account';
import { authenticationService } from '@services/authenticationService';
import { CacheService } from '@services/cacheService';
import { errorService } from '@services/errorService';

jest.mock('@logger/logger', () => ({
  cliLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  httpLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@models/account');
jest.mock('@services/cacheService');
jest.mock('@services/errorService');

describe('AuthenticationService', () => {
  const mockCacheService = {
    invalidateAccount: jest.fn(),
  };

  const mockAccount = {
    account_id: 1,
    account_name: 'Test User',
    email: 'test@example.com',
    uid: 'test-uid-123',
    default_profile_id: 101,
    register: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(CacheService, 'getInstance').mockReturnValue(mockCacheService as any);

    Object.defineProperty(authenticationService, 'cache', {
      value: mockCacheService,
      writable: true,
    });

    (errorService.assertExists as jest.Mock).mockImplementation((entity) => {
      if (!entity) throw new Error('Entity not found');
      return true;
    });

    (errorService.assertNotExists as jest.Mock).mockImplementation((entity, entityName, field, value) => {
      if (entity) throw new Error(`${entityName} with ${field} ${value} already exists`);
      return true;
    });

    (errorService.handleError as jest.Mock).mockImplementation((error) => {
      throw error;
    });
  });

  describe('login', () => {
    it('should successfully login an existing user', async () => {
      (Account.findByUID as jest.Mock).mockResolvedValue(mockAccount);

      const result = await authenticationService.login('test-uid-123');

      expect(Account.findByUID).toHaveBeenCalledWith('test-uid-123');
      expect(errorService.assertExists).toHaveBeenCalledWith(mockAccount, 'Account', 'test-uid-123');
      expect(httpLogger.info).toHaveBeenCalledWith('User logged in: test@example.com', { userId: 'test-uid-123' });
      expect(result).toEqual(mockAccount);
    });

    it('should throw error when user does not exist', async () => {
      (Account.findByUID as jest.Mock).mockResolvedValue(null);
      (errorService.assertExists as jest.Mock).mockImplementation(() => {
        throw new Error('Account not found');
      });

      await expect(authenticationService.login('nonexistent-uid')).rejects.toThrow('Account not found');
      expect(Account.findByUID).toHaveBeenCalledWith('nonexistent-uid');
      expect(errorService.assertExists).toHaveBeenCalledWith(null, 'Account', 'nonexistent-uid');
      expect(httpLogger.info).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors during login', async () => {
      const dbError = new Error('Database connection failed');
      (Account.findByUID as jest.Mock).mockRejectedValue(dbError);

      await expect(authenticationService.login('test-uid-123')).rejects.toThrow('Database connection failed');
      expect(errorService.handleError).toHaveBeenCalledWith(dbError, 'login(test-uid-123)');
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      (Account.findByEmail as jest.Mock).mockResolvedValue(null);
      (Account.findByUID as jest.Mock).mockResolvedValue(null);
      (Account as unknown as jest.Mock).mockImplementation(() => ({
        ...mockAccount,
        register: jest.fn().mockResolvedValue(undefined),
      }));

      const result = await authenticationService.register('Test User', 'test@example.com', 'new-uid-123');

      expect(Account.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(Account.findByUID).toHaveBeenCalledWith('new-uid-123');
      expect(Account).toHaveBeenCalledWith('Test User', 'test@example.com', 'new-uid-123');
      expect(result.register).toHaveBeenCalled();
      expect(httpLogger.info).toHaveBeenCalledWith('New user registered: test@example.com', { userId: 'new-uid-123' });
    });

    it('should throw error when email already exists', async () => {
      (Account.findByEmail as jest.Mock).mockResolvedValue(mockAccount);
      (errorService.assertNotExists as jest.Mock).mockImplementation(() => {
        throw new Error('Account with email test@example.com already exists');
      });

      await expect(authenticationService.register('Test User', 'test@example.com', 'new-uid-123')).rejects.toThrow(
        'Account with email test@example.com already exists',
      );

      expect(Account.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(errorService.assertNotExists).toHaveBeenCalledWith(mockAccount, 'Account', 'email', 'test@example.com');
      expect(Account.findByUID).not.toHaveBeenCalled();
    });

    it('should throw error when UID already exists', async () => {
      (Account.findByEmail as jest.Mock).mockResolvedValue(null);
      (Account.findByUID as jest.Mock).mockResolvedValue(mockAccount);
      (errorService.assertNotExists as jest.Mock)
        .mockImplementationOnce(() => true)
        .mockImplementationOnce(() => {
          throw new Error('Account with uid test-uid-123 already exists');
        });

      await expect(authenticationService.register('Test User', 'new@example.com', 'test-uid-123')).rejects.toThrow(
        'Account with uid test-uid-123 already exists',
      );

      expect(Account.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(Account.findByUID).toHaveBeenCalledWith('test-uid-123');
      expect(errorService.assertNotExists).toHaveBeenNthCalledWith(2, mockAccount, 'Account', 'uid', 'test-uid-123');
    });

    it('should handle registration failure', async () => {
      (Account.findByEmail as jest.Mock).mockResolvedValue(null);
      (Account.findByUID as jest.Mock).mockResolvedValue(null);

      const registerError = new Error('Registration failed');
      const mockNewAccount = {
        ...mockAccount,
        register: jest.fn().mockRejectedValue(registerError),
      };

      (Account as unknown as jest.Mock).mockImplementation(() => mockNewAccount);

      await expect(authenticationService.register('Test User', 'test@example.com', 'new-uid-123')).rejects.toThrow(
        'Registration failed',
      );

      expect(mockNewAccount.register).toHaveBeenCalled();
      expect(errorService.handleError).toHaveBeenCalledWith(
        registerError,
        'register(Test User, test@example.com, new-uid-123)',
      );
    });
  });

  describe('googleLogin', () => {
    it('should login existing user with Google credentials', async () => {
      (Account.findByUID as jest.Mock).mockResolvedValue(mockAccount);

      const result = await authenticationService.googleLogin('Test User', 'test@example.com', 'test-uid-123');

      expect(Account.findByUID).toHaveBeenCalledWith('test-uid-123');
      expect(Account.findByEmail).not.toHaveBeenCalled();
      expect(httpLogger.info).toHaveBeenCalledWith('User logged in via Google: test@example.com', {
        userId: 'test-uid-123',
      });

      expect(result).toEqual({
        account: mockAccount,
        isNewAccount: false,
      });
    });

    it('should register new user with Google credentials', async () => {
      (Account.findByUID as jest.Mock).mockResolvedValue(null);
      (Account.findByEmail as jest.Mock).mockResolvedValue(null);

      const mockNewAccount = {
        ...mockAccount,
        uid: 'new-google-uid',
        register: jest.fn().mockResolvedValue(undefined),
      };

      (Account as unknown as jest.Mock).mockImplementation(() => mockNewAccount);

      const result = await authenticationService.googleLogin('Google User', 'google@example.com', 'new-google-uid');

      expect(Account.findByUID).toHaveBeenCalledWith('new-google-uid');
      expect(Account.findByEmail).toHaveBeenCalledWith('google@example.com');
      expect(Account).toHaveBeenCalledWith('Google User', 'google@example.com', 'new-google-uid');
      expect(mockNewAccount.register).toHaveBeenCalled();

      expect(result).toEqual({
        account: mockNewAccount,
        isNewAccount: true,
      });
    });

    it('should throw error when email is already registered with different auth', async () => {
      (Account.findByUID as jest.Mock).mockResolvedValue(null);
      (Account.findByEmail as jest.Mock).mockResolvedValue({
        ...mockAccount,
        uid: 'different-auth-uid',
      });

      await expect(
        authenticationService.googleLogin('Google User', 'test@example.com', 'google-uid-123'),
      ).rejects.toThrow(CustomError);

      expect(Account.findByUID).toHaveBeenCalledWith('google-uid-123');
      expect(Account.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(Account).not.toHaveBeenCalled();
    });

    it('should handle errors in Google login process', async () => {
      const dbError = new Error('Database error');
      (Account.findByUID as jest.Mock).mockRejectedValue(dbError);

      await expect(
        authenticationService.googleLogin('Google User', 'google@example.com', 'google-uid-123'),
      ).rejects.toThrow('Database error');

      expect(errorService.handleError).toHaveBeenCalledWith(
        dbError,
        'googleLogin(Google User, google@example.com, google-uid-123)',
      );
    });
  });

  describe('logout', () => {
    it('should invalidate account cache on logout', async () => {
      await authenticationService.logout('1');

      expect(mockCacheService.invalidateAccount).toHaveBeenCalledWith('1');
      expect(cliLogger.info).toHaveBeenCalledWith('User logged out: account ID 1');
    });

    it('should handle errors during logout', async () => {
      const cacheError = new Error('Cache invalidation failed');
      mockCacheService.invalidateAccount.mockImplementation(() => {
        throw cacheError;
      });

      await expect(authenticationService.logout('1')).rejects.toThrow('Cache invalidation failed');
      expect(errorService.handleError).toHaveBeenCalledWith(cacheError, 'logout(1)');
    });
  });
});
