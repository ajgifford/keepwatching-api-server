import { accountService } from '@ajgifford/keepwatching-common-server/services';
import { editAccount, googleLogin, login, logout, register } from '@controllers/accountController';

// Mock the external packages
jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  accountService: {
    register: jest.fn(),
    login: jest.fn(),
    googleLogin: jest.fn(),
    logout: jest.fn(),
    editAccount: jest.fn(),
  },
}));

jest.mock('@ajgifford/keepwatching-common-server/utils', () => ({
  getAccountImage: jest.fn(),
  getPhotoForGoogleAccount: jest.fn(),
}));

describe('accountController', () => {
  let req: any, res: any, next: jest.Mock;

  const mockAccount = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    uid: 'test-uid-123',
    defaultProfileId: 101,
    image: 'account-image.png',
  };

  beforeEach(() => {
    req = {
      params: { accountId: 1, profileId: 123 },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new account successfully', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        uid: 'test-uid-123',
      };

      (accountService.register as jest.Mock).mockResolvedValue(mockAccount);

      await register(req, res, next);

      expect(accountService.register).toHaveBeenCalledWith('Test User', 'test@example.com', 'test-uid-123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account registered successfully',
        result: {
          id: 1,
          name: 'Test User',
          uid: 'test-uid-123',
          email: 'test@example.com',
          image: 'account-image.png',
          defaultProfileId: 101,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle registration errors', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        uid: 'test-uid-123',
      };

      const error = new Error('Registration failed');
      (accountService.register as jest.Mock).mockRejectedValue(error);

      await register(req, res, next);

      expect(accountService.register).toHaveBeenCalledWith('Test User', 'test@example.com', 'test-uid-123');
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login an existing account successfully', async () => {
      req.body = {
        uid: 'test-uid-123',
      };

      (accountService.login as jest.Mock).mockResolvedValue(mockAccount);

      await login(req, res, next);

      expect(accountService.login).toHaveBeenCalledWith('test-uid-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        result: {
          id: 1,
          name: 'Test User',
          uid: 'test-uid-123',
          email: 'test@example.com',
          image: 'account-image.png',
          defaultProfileId: 101,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      req.body = {
        uid: 'test-uid-123',
      };

      const error = new Error('Login failed');
      (accountService.login as jest.Mock).mockRejectedValue(error);

      await login(req, res, next);

      expect(accountService.login).toHaveBeenCalledWith('test-uid-123');
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('googleLogin', () => {
    it('should handle new account registration via Google', async () => {
      req.body = {
        name: 'Google User',
        email: 'google@example.com',
        uid: 'google-uid-123',
        photoURL: 'https://example.com/photo.jpg',
      };

      const googleAccount = {
        ...mockAccount,
        name: 'Google User',
        email: 'google@example.com',
        uid: 'google-uid-123',
      };

      (accountService.googleLogin as jest.Mock).mockResolvedValue({
        account: googleAccount,
        isNewAccount: true,
      });

      await googleLogin(req, res, next);

      expect(accountService.googleLogin).toHaveBeenCalledWith(
        'Google User',
        'google@example.com',
        'google-uid-123',
        'https://example.com/photo.jpg',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account registered successfully',
        result: {
          id: 1,
          name: 'Google User',
          uid: 'google-uid-123',
          email: 'google@example.com',
          image: 'account-image.png',
          defaultProfileId: 101,
          isNewAccount: true,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle existing account login via Google', async () => {
      req.body = {
        name: 'Google User',
        email: 'google@example.com',
        uid: 'google-uid-123',
        photoURL: 'https://example.com/photo.jpg',
      };

      const googleAccount = {
        ...mockAccount,
        name: 'Google User',
        email: 'google@example.com',
        uid: 'google-uid-123',
      };

      (accountService.googleLogin as jest.Mock).mockResolvedValue({
        account: googleAccount,
        isNewAccount: false,
      });

      await googleLogin(req, res, next);

      expect(accountService.googleLogin).toHaveBeenCalledWith(
        'Google User',
        'google@example.com',
        'google-uid-123',
        'https://example.com/photo.jpg',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        result: {
          id: 1,
          name: 'Google User',
          uid: 'google-uid-123',
          email: 'google@example.com',
          image: 'account-image.png',
          defaultProfileId: 101,
          isNewAccount: false,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle Google login errors', async () => {
      req.body = {
        name: 'Google User',
        email: 'google@example.com',
        uid: 'google-uid-123',
        photoURL: 'https://example.com/photo.jpg',
      };

      const error = new Error('Google login failed');
      (accountService.googleLogin as jest.Mock).mockRejectedValue(error);

      await googleLogin(req, res, next);

      expect(accountService.googleLogin).toHaveBeenCalledWith(
        'Google User',
        'google@example.com',
        'google-uid-123',
        'https://example.com/photo.jpg',
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('logout', () => {
    it('should handle logout successfully', async () => {
      req.body = {
        accountId: '1',
      };

      (accountService.logout as jest.Mock).mockResolvedValue(undefined);

      await logout(req, res, next);

      expect(accountService.logout).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Account logged out' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('editAccount', () => {
    it('should edit account successfully', async () => {
      req.body = { name: 'Updated Account Name', defaultProfileId: 12 };
      const mockUpdatedAccount = {
        id: 1,
        name: 'Updated Account Name',
        email: 'test@example.com',
        image: 'account.jpg',
        defaultProfileId: 12,
      };

      (accountService.editAccount as jest.Mock).mockResolvedValue(mockUpdatedAccount);

      await editAccount(req, res, next);

      expect(accountService.editAccount).toHaveBeenCalledWith(1, 'Updated Account Name', 12);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Updated account 1',
        result: mockUpdatedAccount,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.body = { name: 'Updated Account Name', defaultProfileId: 12 };
      const error = new Error('Account not found');
      (accountService.editAccount as jest.Mock).mockRejectedValue(error);

      await editAccount(req, res, next);

      expect(accountService.editAccount).toHaveBeenCalledWith(1, 'Updated Account Name', 12);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
