import { googleLogin, login, logout, register } from '@controllers/authenticationController';
import { authenticationService } from '@services/authenticationService';
import { getAccountImage, getPhotoForGoogleAccount } from '@utils/imageUtility';

jest.mock('@services/authenticationService');
jest.mock('@utils/imageUtility');

describe('AuthenticationController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  const mockAccount = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    uid: 'test-uid-123',
    default_profile_id: 101,
    image: 'account-image.png',
  };

  beforeEach(() => {
    req = {
      params: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();

    (getAccountImage as jest.Mock).mockReturnValue('account-image-url.jpg');
    (getPhotoForGoogleAccount as jest.Mock).mockReturnValue('google-profile-image-url.jpg');
  });

  describe('register', () => {
    it('should register a new account successfully', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        uid: 'test-uid-123',
      };

      (authenticationService.register as jest.Mock).mockResolvedValue(mockAccount);

      await register(req, res, next);

      expect(authenticationService.register).toHaveBeenCalledWith('Test User', 'test@example.com', 'test-uid-123');
      expect(getAccountImage).toHaveBeenCalledWith('account-image.png', 'Test User');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account registered successfully',
        result: {
          id: 1,
          name: 'Test User',
          uid: 'test-uid-123',
          email: 'test@example.com',
          image: 'account-image-url.jpg',
          default_profile_id: 101,
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
      (authenticationService.register as jest.Mock).mockRejectedValue(error);

      await register(req, res, next);

      expect(authenticationService.register).toHaveBeenCalledWith('Test User', 'test@example.com', 'test-uid-123');
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

      (authenticationService.login as jest.Mock).mockResolvedValue(mockAccount);

      await login(req, res, next);

      expect(authenticationService.login).toHaveBeenCalledWith('test-uid-123');
      expect(getAccountImage).toHaveBeenCalledWith('account-image.png', 'Test User');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        result: {
          id: 1,
          name: 'Test User',
          uid: 'test-uid-123',
          email: 'test@example.com',
          image: 'account-image-url.jpg',
          default_profile_id: 101,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      req.body = {
        uid: 'test-uid-123',
      };

      const error = new Error('Login failed');
      (authenticationService.login as jest.Mock).mockRejectedValue(error);

      await login(req, res, next);

      expect(authenticationService.login).toHaveBeenCalledWith('test-uid-123');
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

      (authenticationService.googleLogin as jest.Mock).mockResolvedValue({
        message: 'Account registered successfully',
        account: googleAccount,
        isNewAccount: true,
      });

      await googleLogin(req, res, next);

      expect(authenticationService.googleLogin).toHaveBeenCalledWith(
        'Google User',
        'google@example.com',
        'google-uid-123',
      );

      expect(getPhotoForGoogleAccount).toHaveBeenCalledWith(
        'Google User',
        'https://example.com/photo.jpg',
        'account-image.png',
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account registered successfully',
        result: {
          id: 1,
          name: 'Google User',
          uid: 'google-uid-123',
          email: 'google@example.com',
          image: 'google-profile-image-url.jpg',
          default_profile_id: 101,
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

      (authenticationService.googleLogin as jest.Mock).mockResolvedValue({
        message: 'Login successful',
        account: googleAccount,
        isNewAccount: false,
      });

      await googleLogin(req, res, next);

      expect(authenticationService.googleLogin).toHaveBeenCalledWith(
        'Google User',
        'google@example.com',
        'google-uid-123',
      );

      expect(getPhotoForGoogleAccount).toHaveBeenCalledWith(
        'Google User',
        'https://example.com/photo.jpg',
        'account-image.png',
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        result: {
          id: 1,
          name: 'Google User',
          uid: 'google-uid-123',
          email: 'google@example.com',
          image: 'google-profile-image-url.jpg',
          default_profile_id: 101,
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
      (authenticationService.googleLogin as jest.Mock).mockRejectedValue(error);

      await googleLogin(req, res, next);

      expect(authenticationService.googleLogin).toHaveBeenCalledWith(
        'Google User',
        'google@example.com',
        'google-uid-123',
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

      (authenticationService.logout as jest.Mock).mockResolvedValue(undefined);

      await logout(req, res, next);

      expect(authenticationService.logout).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Account logged out' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
