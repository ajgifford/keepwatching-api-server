import { accountService } from '@ajgifford/keepwatching-common-server/services';
import { trackAccountActivity } from '@middleware/accountActivityMiddleware';
import { NextFunction, Request, Response } from 'express';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  accountService: {
    register: jest.fn(),
    login: jest.fn(),
    googleLogin: jest.fn(),
    logout: jest.fn(),
    editAccount: jest.fn(),
    trackActivity: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('activityMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('trackUserActivity', () => {
    it('should call accountService.trackActivity when accountId is present in params', () => {
      mockRequest.params = { accountId: '123' };

      trackAccountActivity(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.trackActivity).toHaveBeenCalledWith('123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next immediately without waiting for trackActivity', () => {
      mockRequest.params = { accountId: '123' };
      let trackingResolved = false;
      jest.spyOn(accountService, 'trackActivity').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        trackingResolved = true;
      });

      trackAccountActivity(mockRequest as Request, mockResponse as Response, mockNext);

      // Next should be called immediately, before tracking completes
      expect(mockNext).toHaveBeenCalled();
      expect(trackingResolved).toBe(false);
    });

    it('should skip tracking when accountId is not present in params', () => {
      mockRequest.params = {};

      trackAccountActivity(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.trackActivity).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call trackActivity even when accountId is not a valid number', () => {
      mockRequest.params = { accountId: 'invalid' };

      trackAccountActivity(mockRequest as Request, mockResponse as Response, mockNext);

      expect(accountService.trackActivity).toHaveBeenCalledWith('invalid');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle errors from trackActivity gracefully without throwing', () => {
      mockRequest.params = { accountId: '123' };
      jest.spyOn(accountService, 'trackActivity').mockRejectedValue(new Error('Database error'));

      expect(() => {
        trackAccountActivity(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass accountId as string for different numeric values', () => {
      const testCases = [
        { input: '1', expected: '1' },
        { input: '999', expected: '999' },
        { input: '123456', expected: '123456' },
      ];

      testCases.forEach(({ input, expected }) => {
        mockRequest.params = { accountId: input };
        const trackActivityMock = jest.spyOn(accountService, 'trackActivity').mockResolvedValue();

        trackAccountActivity(mockRequest as Request, mockResponse as Response, mockNext);

        expect(trackActivityMock).toHaveBeenCalledWith(expected);
        jest.clearAllMocks();
      });
    });
  });
});
