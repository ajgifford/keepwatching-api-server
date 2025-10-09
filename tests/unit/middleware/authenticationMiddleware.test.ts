import { authenticateUser } from '@middleware/authenticationMiddleware';
import { NextFunction, Request, Response } from 'express';
import admin from 'firebase-admin';

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const mockAuth = {
    verifyIdToken: jest.fn(),
  };
  return {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    auth: jest.fn(() => mockAuth),
  };
});

// Mock the service account file
jest.mock('../../certs/keepwatching-service-account.json', () => ({}), { virtual: true });

describe('authenticationMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockAuth: any;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    mockAuth = (admin.auth as jest.Mock)();
    jest.clearAllMocks();
    // Silence console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('authenticateUser', () => {
    it('should authenticate user with valid Bearer token', async () => {
      const mockDecodedToken = {
        uid: 'test-uid-123',
        email: 'test@example.com',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      await authenticateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', async () => {
      mockRequest.headers = {};

      await authenticateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuth.verifyIdToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authorization header missing or malformed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Basic some-token',
      };

      await authenticateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuth.verifyIdToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authorization header missing or malformed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is malformed (no token after Bearer)', async () => {
      mockRequest.headers = {
        authorization: 'Bearer',
      };

      await authenticateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authorization header missing or malformed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token verification fails', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockAuth.verifyIdToken.mockRejectedValue(new Error('Token verification failed'));

      await authenticateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('invalid-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error authenticating user:', expect.any(Error));
    });

    it('should handle expired token error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      const expiredError = new Error('Token expired');
      mockAuth.verifyIdToken.mockRejectedValue(expiredError);

      await authenticateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('expired-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authorization header with only Bearer keyword', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      await authenticateUser(mockRequest as Request, mockResponse as Response, mockNext);

      // When there's an empty token after Bearer, verifyIdToken fails
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach decoded token to request object', async () => {
      const mockDecodedToken = {
        uid: 'test-uid-789',
        email: 'test3@example.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg',
      };

      mockRequest.headers = {
        authorization: 'Bearer token-with-extra-claims',
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      await authenticateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(mockRequest.user?.uid).toBe('test-uid-789');
      expect(mockRequest.user?.email).toBe('test3@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle different token formats correctly', async () => {
      const testCases = [
        { token: 'short', uid: 'uid-1' },
        { token: 'very-long-token-with-many-parts-and-hyphens', uid: 'uid-2' },
        { token: 'token.with.dots', uid: 'uid-3' },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        mockRequest.headers = {
          authorization: `Bearer ${testCase.token}`,
        };

        const mockDecodedToken = { uid: testCase.uid };
        mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

        await authenticateUser(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(testCase.token);
        expect(mockRequest.user).toEqual(mockDecodedToken);
        expect(mockNext).toHaveBeenCalled();
      }
    });
  });
});
