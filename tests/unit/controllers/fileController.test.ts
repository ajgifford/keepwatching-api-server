import { BadRequestError } from '@ajgifford/keepwatching-common-server';
import { getUploadDirectory } from '@ajgifford/keepwatching-common-server/config';
import { appLogger } from '@ajgifford/keepwatching-common-server/logger';
import { accountService, profileService } from '@ajgifford/keepwatching-common-server/testing';
import { uploadAccountImage, uploadProfileImage } from '@controllers/fileController';
import uploadFileMiddleware from '@middleware/uploadMiddleware';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('@middleware/uploadMiddleware', () => jest.fn());
jest.mock('@ajgifford/keepwatching-common-server/config', () => ({
  getUploadDirectory: jest.fn().mockReturnValue('uploads/'),
}));
jest.mock('fs', () => ({
  unlink: jest.fn(),
}));

// Mock modules before importing them
jest.mock('@ajgifford/keepwatching-common-server/logger', () => ({
  appLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@ajgifford/keepwatching-common-server/utils', () => ({
  getAccountImage: jest.fn(),
  getProfileImage: jest.fn(),
}));

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  accountService: accountService,
  profileService: profileService,
}));

describe('fileController', () => {
  let req: Request;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { accountId: 1, profileId: 123 }, // Now properly typed as numbers
      file: {
        fieldname: 'file',
        originalname: 'original.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: '/tmp',
        filename: 'test-image.jpg',
        path: '/tmp/test-image.jpg',
        size: 1024,
        // Provide a minimal implementation for the stream property
        stream: {
          on: jest.fn(),
        } as any,
      } as Express.Multer.File,
    } as unknown as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('uploadAccountImage', () => {
    it('should upload an account image successfully', async () => {
      const mockAccount = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        image: 'old-image.jpg',
        defaultProfileId: 101,
      };

      const mockUpdatedAccount = {
        ...mockAccount,
        image: 'test-image.jpg',
      };

      (uploadFileMiddleware as jest.Mock).mockImplementation(() => {
        return Promise.resolve();
      });

      (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (accountService.updateAccountImage as jest.Mock).mockResolvedValue(mockUpdatedAccount);

      await uploadAccountImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(accountService.findAccountById).toHaveBeenCalledWith(1);
      expect(accountService.updateAccountImage).toHaveBeenCalledWith(1, 'test-image.jpg');
      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(getUploadDirectory(), 'accounts', 'old-image.jpg'),
        expect.any(Function),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Uploaded the file successfully: test-image.jpg',
        result: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          image: 'test-image.jpg',
          defaultProfileId: 101,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle when no file is uploaded', async () => {
      req.file = undefined;

      (uploadFileMiddleware as jest.Mock).mockResolvedValue(undefined);

      await uploadAccountImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        code: 'NO_FILE_PROVIDED',
        error: 'No file provided',
        message: 'Please upload a file!',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle when account is not found', async () => {
      (uploadFileMiddleware as jest.Mock).mockResolvedValue(undefined);
      (accountService.findAccountById as jest.Mock).mockResolvedValue(null);

      await uploadAccountImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(accountService.findAccountById).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('should handle when account image update fails', async () => {
      const mockAccount = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        image: 'old-image.jpg',
        default_profile_id: 101,
      };

      (uploadFileMiddleware as jest.Mock).mockResolvedValue(undefined);
      (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (accountService.updateAccountImage as jest.Mock).mockResolvedValue(null);

      await uploadAccountImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(accountService.findAccountById).toHaveBeenCalledWith(1);
      expect(accountService.updateAccountImage).toHaveBeenCalledWith(1, 'test-image.jpg');
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('should handle file deletion errors gracefully', async () => {
      const mockAccount = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        image: 'old-image.jpg',
        default_profile_id: 101,
      };

      const mockUpdatedAccount = {
        ...mockAccount,
        image: 'test-image.jpg',
      };

      (uploadFileMiddleware as jest.Mock).mockResolvedValue(undefined);
      (accountService.findAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (accountService.updateAccountImage as jest.Mock).mockResolvedValue(mockUpdatedAccount);

      // Simulate ENOENT error (file not found)
      const enoentError = new Error('File not found');
      (enoentError as any).code = 'ENOENT';
      (fs.unlink as unknown as jest.Mock).mockImplementation((path, callback) => {
        callback(enoentError);
      });

      await uploadAccountImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(getUploadDirectory(), 'accounts', 'old-image.jpg'),
        expect.any(Function),
      );
      expect(appLogger.info).toHaveBeenCalledWith('Previous account image file not found when attempting to delete');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors during upload', async () => {
      const error = new Error('Upload failed');
      (uploadFileMiddleware as jest.Mock).mockRejectedValue(error);

      await uploadAccountImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('uploadProfileImage', () => {
    it('should upload a profile image successfully', async () => {
      const mockProfile = {
        id: 123,
        name: 'Test Profile',
        image: 'old-profile.jpg',
      };

      const mockUpdatedProfile = {
        ...mockProfile,
        image: 'test-image.jpg',
      };

      (uploadFileMiddleware as jest.Mock).mockResolvedValue(undefined);
      (profileService.findProfileById as jest.Mock).mockResolvedValue(mockProfile);
      (profileService.updateProfileImage as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      await uploadProfileImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(profileService.findProfileById).toHaveBeenCalledWith(123);
      expect(profileService.updateProfileImage).toHaveBeenCalledWith(123, 'test-image.jpg');
      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(getUploadDirectory(), 'profiles', 'old-profile.jpg'),
        expect.any(Function),
      );
      expect(profileService.invalidateProfileCache).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Uploaded the file successfully: test-image.jpg',
        profile: {
          id: 123,
          name: 'Test Profile',
          image: 'test-image.jpg',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle when no file is uploaded', async () => {
      req.file = undefined;

      (uploadFileMiddleware as jest.Mock).mockResolvedValue(undefined);

      await uploadProfileImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        code: 'NO_FILE_PROVIDED',
        error: 'No file provided',
        message: 'Please upload a file!',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle when profile is not found', async () => {
      (uploadFileMiddleware as jest.Mock).mockResolvedValue(undefined);
      (profileService.findProfileById as jest.Mock).mockResolvedValue(null);

      await uploadProfileImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(profileService.findProfileById).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('should handle when profile image update fails', async () => {
      const mockProfile = {
        id: 123,
        name: 'Test Profile',
        image: 'old-profile.jpg',
      };

      (uploadFileMiddleware as jest.Mock).mockResolvedValue(undefined);
      (profileService.findProfileById as jest.Mock).mockResolvedValue(mockProfile);
      (profileService.updateProfileImage as jest.Mock).mockResolvedValue(null);

      await uploadProfileImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(profileService.findProfileById).toHaveBeenCalledWith(123);
      expect(profileService.updateProfileImage).toHaveBeenCalledWith(123, 'test-image.jpg');
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('should handle unexpected file deletion errors', async () => {
      const mockProfile = {
        id: 123,
        name: 'Test Profile',
        image: 'old-profile.jpg',
      };

      const mockUpdatedProfile = {
        ...mockProfile,
        image: 'test-image.jpg',
      };

      (uploadFileMiddleware as jest.Mock).mockResolvedValue(undefined);
      (profileService.findProfileById as jest.Mock).mockResolvedValue(mockProfile);
      (profileService.updateProfileImage as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      // Simulate unexpected error
      const unexpectedError = new Error('Unexpected error');
      (fs.unlink as unknown as jest.Mock).mockImplementation((path, callback) => {
        callback(unexpectedError);
      });

      await uploadProfileImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(getUploadDirectory(), 'profiles', 'old-profile.jpg'),
        expect.any(Function),
      );
      expect(appLogger.warn).toHaveBeenCalledWith('Error deleting previous profile image file', {
        error: 'Unexpected error',
        filePath: 'uploads\\profiles\\old-profile.jpg',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors during upload', async () => {
      const error = new Error('Upload failed');
      (uploadFileMiddleware as jest.Mock).mockRejectedValue(error);

      await uploadProfileImage(req as Request, res as Response, next as NextFunction);

      expect(uploadFileMiddleware).toHaveBeenCalledWith(req, res);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});
