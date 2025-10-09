import { ForbiddenError, UnauthorizedError } from '@ajgifford/keepwatching-common-server';
import { accountService } from '@ajgifford/keepwatching-common-server/services';
import { authorizeAccountAccess } from '@middleware/authorizationMiddleware';
import { NextFunction, Request, Response } from 'express';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  accountService: {
    findAccountById: jest.fn(),
    findAccountIdByProfileId: jest.fn(),
  },
}));

describe('authorizationMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: undefined,
      params: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authorizeAccountAccess', () => {
    it('should call next when user is authenticated and owns the account', async () => {
      const mockAccount = {
        id: 'account-123',
        uid: 'firebase-uid-123',
        email: 'test@example.com',
      };

      mockRequest.user = { uid: 'firebase-uid-123' } as any;
      mockRequest.params = { accountId: 'account-123' };

      (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.findAccountById).toHaveBeenCalledWith('account-123');
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with UnauthorizedError when user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { accountId: 'account-123' };

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.findAccountById).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
        }),
      );
    });

    it('should call next with UnauthorizedError when user.uid is missing', async () => {
      mockRequest.user = {} as any; // User object exists but uid is missing
      mockRequest.params = { accountId: 'account-123' };

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.findAccountById).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should call next with ForbiddenError when account does not exist', async () => {
      mockRequest.user = { uid: 'firebase-uid-123' } as any;
      mockRequest.params = { accountId: 'non-existent-account' };

      (accountService.findAccountById as jest.Mock).mockResolvedValue(null);

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.findAccountById).toHaveBeenCalledWith('non-existent-account');
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You do not have permission to access this account',
        }),
      );
    });

    it('should call next with ForbiddenError when user does not own the account', async () => {
      const mockAccount = {
        id: 'account-123',
        uid: 'different-firebase-uid',
        email: 'other@example.com',
      };

      mockRequest.user = { uid: 'firebase-uid-123' } as any;
      mockRequest.params = { accountId: 'account-123' };

      (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.findAccountById).toHaveBeenCalledWith('account-123');
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You do not have permission to access this account',
        }),
      );
    });

    it('should verify profile ownership when profileId is provided', async () => {
      const mockAccount = {
        id: 'account-123',
        uid: 'firebase-uid-123',
        email: 'test@example.com',
      };

      mockRequest.user = { uid: 'firebase-uid-123' } as any;
      mockRequest.params = { accountId: 'account-123', profileId: 'profile-456' };

      (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (accountService.findAccountIdByProfileId as jest.Mock).mockResolvedValue('account-123');

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.findAccountById).toHaveBeenCalledWith('account-123');
      expect(accountService.findAccountIdByProfileId).toHaveBeenCalledWith('profile-456');
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with ForbiddenError when profile does not exist', async () => {
      const mockAccount = {
        id: 'account-123',
        uid: 'firebase-uid-123',
        email: 'test@example.com',
      };

      mockRequest.user = { uid: 'firebase-uid-123' } as any;
      mockRequest.params = { accountId: 'account-123', profileId: 'non-existent-profile' };

      (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (accountService.findAccountIdByProfileId as jest.Mock).mockResolvedValue(null);

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.findAccountById).toHaveBeenCalledWith('account-123');
      expect(accountService.findAccountIdByProfileId).toHaveBeenCalledWith('non-existent-profile');
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access forbidden to this profile, it does not belong to the provided account',
        }),
      );
    });

    it('should call next with ForbiddenError when profile belongs to different account', async () => {
      const mockAccount = {
        id: 'account-123',
        uid: 'firebase-uid-123',
        email: 'test@example.com',
      };

      mockRequest.user = { uid: 'firebase-uid-123' } as any;
      mockRequest.params = { accountId: 'account-123', profileId: 'profile-456' };

      (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (accountService.findAccountIdByProfileId as jest.Mock).mockResolvedValue('different-account-456');

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.findAccountById).toHaveBeenCalledWith('account-123');
      expect(accountService.findAccountIdByProfileId).toHaveBeenCalledWith('profile-456');
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access forbidden to this profile, it does not belong to the provided account',
        }),
      );
    });

    it('should not check profile ownership when profileId is not provided', async () => {
      const mockAccount = {
        id: 'account-123',
        uid: 'firebase-uid-123',
        email: 'test@example.com',
      };

      mockRequest.user = { uid: 'firebase-uid-123' } as any;
      mockRequest.params = { accountId: 'account-123' };

      (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.findAccountById).toHaveBeenCalledWith('account-123');
      expect(accountService.findAccountIdByProfileId).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');

      mockRequest.user = { uid: 'firebase-uid-123' } as any;
      mockRequest.params = { accountId: 'account-123' };

      (accountService.findAccountById as jest.Mock).mockRejectedValue(dbError);

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.findAccountById).toHaveBeenCalledWith('account-123');
      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it('should handle errors from findAccountIdByProfileId', async () => {
      const mockAccount = {
        id: 'account-123',
        uid: 'firebase-uid-123',
        email: 'test@example.com',
      };
      const dbError = new Error('Profile lookup failed');

      mockRequest.user = { uid: 'firebase-uid-123' } as any;
      mockRequest.params = { accountId: 'account-123', profileId: 'profile-456' };

      (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (accountService.findAccountIdByProfileId as jest.Mock).mockRejectedValue(dbError);

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.findAccountById).toHaveBeenCalledWith('account-123');
      expect(accountService.findAccountIdByProfileId).toHaveBeenCalledWith('profile-456');
      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it('should handle multiple profiles for the same account', async () => {
      const mockAccount = {
        id: 'account-123',
        uid: 'firebase-uid-123',
        email: 'test@example.com',
      };

      const profileIds = ['profile-1', 'profile-2', 'profile-3'];

      for (const profileId of profileIds) {
        jest.clearAllMocks();
        mockRequest.user = { uid: 'firebase-uid-123' } as any;
        mockRequest.params = { accountId: 'account-123', profileId };

        (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
        (accountService.findAccountIdByProfileId as jest.Mock).mockResolvedValue('account-123');

        await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

        expect(accountService.findAccountIdByProfileId).toHaveBeenCalledWith(profileId);
        expect(mockNext).toHaveBeenCalledWith();
        expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
      }
    });

    it('should handle string comparison for account IDs correctly', async () => {
      const mockAccount = {
        id: 'account-123',
        uid: 'firebase-uid-123',
        email: 'test@example.com',
      };

      mockRequest.user = { uid: 'firebase-uid-123' } as any;
      mockRequest.params = { accountId: 'account-123', profileId: 'profile-456' };

      (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      // Return same ID but ensure string comparison works
      (accountService.findAccountIdByProfileId as jest.Mock).mockResolvedValue('account-123');

      await authorizeAccountAccess(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
