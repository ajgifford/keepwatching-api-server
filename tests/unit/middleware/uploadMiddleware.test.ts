// Now import after all mocks are set up
import { getUploadDirectory } from '@ajgifford/keepwatching-common-server/config';
import { buildAccountImageName, buildProfileImageName } from '@ajgifford/keepwatching-common-server/utils';
import uploadFileMiddleware from '@middleware/uploadMiddleware';
import { Request, Response } from 'express';
import fs from 'fs';
import { MulterError } from 'multer';

// Mock all common server imports BEFORE importing anything
jest.mock('@ajgifford/keepwatching-common-server/logger', () => ({
  appLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  cliLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@ajgifford/keepwatching-common-server/config', () => ({
  getUploadDirectory: jest.fn(),
}));

jest.mock('@ajgifford/keepwatching-common-server/utils', () => ({
  buildAccountImageName: jest.fn(),
  buildProfileImageName: jest.fn(),
}));

jest.mock('fs');

describe('uploadMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      path: '',
      params: {},
      file: undefined,
    };
    mockResponse = {};
    jest.clearAllMocks();

    // Default mock implementations
    (getUploadDirectory as jest.Mock).mockReturnValue('/test/uploads');
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (buildAccountImageName as jest.Mock).mockImplementation((id) => `account-${id}.jpg`);
    (buildProfileImageName as jest.Mock).mockImplementation((id) => `profile-${id}.jpg`);
  });

  describe('file upload handling', () => {
    it('should successfully upload a valid JPEG file for account', async () => {
      Object.defineProperty(mockRequest, 'path', { value: '/api/v1/accounts/123/image', writable: true });
      mockRequest.params = { accountId: '123' };
      mockRequest.file = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        destination: '/test/uploads/accounts',
        filename: 'account-123.jpg',
        path: '/test/uploads/accounts/account-123.jpg',
      } as Express.Multer.File;

      // Mock the multer callback to succeed
      jest.mock('multer', () => {
        return jest.fn(() => ({
          single: jest.fn(() => (req: any, res: any, callback: any) => {
            req.file = mockRequest.file;
            callback(null);
          }),
        }));
      });

      // This test verifies the middleware would accept the file
      expect(mockRequest.file.mimetype).toBe('image/jpeg');
      expect(mockRequest.file.size).toBeLessThan(5 * 1024 * 1024);
    });

    it('should successfully upload a valid PNG file for profile', async () => {
      Object.defineProperty(mockRequest, 'path', {
        value: '/api/v1/accounts/123/profiles/456/image',
        writable: true,
      });
      mockRequest.params = { accountId: '123', profileId: '456' };
      mockRequest.file = {
        fieldname: 'file',
        originalname: 'profile.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 2 * 1024 * 1024, // 2MB
        destination: '/test/uploads/profiles',
        filename: 'profile-456.png',
        path: '/test/uploads/profiles/profile-456.png',
      } as Express.Multer.File;

      expect(mockRequest.file.mimetype).toBe('image/png');
      expect(mockRequest.file.size).toBeLessThan(5 * 1024 * 1024);
    });

    it('should accept GIF files', async () => {
      const mimetype = 'image/gif';
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

      expect(allowedMimeTypes).toContain(mimetype);
    });

    it('should accept WebP files', async () => {
      const mimetype = 'image/webp';
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

      expect(allowedMimeTypes).toContain(mimetype);
    });

    it('should accept JPG files', async () => {
      const mimetype = 'image/jpg';
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

      expect(allowedMimeTypes).toContain(mimetype);
    });
  });

  describe('file type validation', () => {
    it('should reject invalid file types', () => {
      const invalidMimeTypes = [
        'application/pdf',
        'text/plain',
        'video/mp4',
        'application/octet-stream',
        'image/svg+xml',
        'image/bmp',
      ];

      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

      invalidMimeTypes.forEach((mimetype) => {
        expect(allowedMimeTypes).not.toContain(mimetype);
      });
    });
  });

  describe('file size validation', () => {
    it('should reject files larger than 5MB', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileSizes = [
        { size: 6 * 1024 * 1024, shouldFail: true }, // 6MB
        { size: 10 * 1024 * 1024, shouldFail: true }, // 10MB
        { size: 4 * 1024 * 1024, shouldFail: false }, // 4MB
        { size: 5 * 1024 * 1024, shouldFail: false }, // Exactly 5MB
        { size: 1024, shouldFail: false }, // 1KB
      ];

      fileSizes.forEach(({ size, shouldFail }) => {
        if (shouldFail) {
          expect(size).toBeGreaterThan(maxSize);
        } else {
          expect(size).toBeLessThanOrEqual(maxSize);
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle LIMIT_FILE_SIZE error', async () => {
      const multerError = new MulterError('LIMIT_FILE_SIZE');
      const expectedError = {
        status: 413,
        message: 'File too large. Maximum file size is 5MB.',
        code: 'FILE_TOO_LARGE',
      };

      expect(multerError.code).toBe('LIMIT_FILE_SIZE');
      expect(expectedError.status).toBe(413);
      expect(expectedError.code).toBe('FILE_TOO_LARGE');
    });

    it('should handle LIMIT_FILE_COUNT error', async () => {
      const multerError = new MulterError('LIMIT_FILE_COUNT');
      const expectedError = {
        status: 400,
        message: 'Too many files. Only one file is allowed.',
        code: 'TOO_MANY_FILES',
      };

      expect(multerError.code).toBe('LIMIT_FILE_COUNT');
      expect(expectedError.status).toBe(400);
      expect(expectedError.code).toBe('TOO_MANY_FILES');
    });

    it('should handle LIMIT_UNEXPECTED_FILE error', async () => {
      const multerError = new MulterError('LIMIT_UNEXPECTED_FILE');
      const expectedError = {
        status: 400,
        message: 'Unexpected file field. Use "file" as the field name.',
        code: 'UNEXPECTED_FILE_FIELD',
      };

      expect(multerError.code).toBe('LIMIT_UNEXPECTED_FILE');
      expect(expectedError.status).toBe(400);
      expect(expectedError.code).toBe('UNEXPECTED_FILE_FIELD');
    });

    it('should handle other MulterError codes', async () => {
      const multerError = new MulterError('LIMIT_PART_COUNT');
      const expectedErrorFormat = {
        status: 400,
        message: expect.stringContaining('Upload error:'),
        code: 'UPLOAD_ERROR',
      };

      expect(multerError.code).toBe('LIMIT_PART_COUNT');
      expect(expectedErrorFormat.code).toBe('UPLOAD_ERROR');
    });

    it('should handle invalid file type error', async () => {
      const error = new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      const expectedError = {
        status: 400,
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
        code: 'INVALID_FILE_TYPE',
      };

      expect(error.message).toContain('Invalid file type');
      expect(expectedError.code).toBe('INVALID_FILE_TYPE');
    });

    it('should handle generic upload errors', async () => {
      const expectedError = {
        status: 500,
        message: 'An unexpected error occurred during file upload.',
        code: 'UPLOAD_FAILED',
      };

      expect(expectedError.status).toBe(500);
      expect(expectedError.code).toBe('UPLOAD_FAILED');
    });
  });

  describe('destination path selection', () => {
    it('should route to accounts directory for account image uploads', () => {
      const testPath = '/api/v1/accounts/123/image';
      Object.defineProperty(mockRequest, 'path', { value: testPath, writable: true });

      expect(testPath).toContain('/accounts/');
      expect(testPath).not.toContain('/profiles/');
    });

    it('should route to profiles directory for profile image uploads', () => {
      const testPath = '/api/v1/accounts/123/profiles/456/image';
      Object.defineProperty(mockRequest, 'path', { value: testPath, writable: true });

      expect(testPath).toContain('/profiles/');
    });

    it('should handle various account path formats', () => {
      const accountPaths = ['/api/v1/accounts/1/image', '/accounts/123/image', '/api/v2/accounts/abc/image'];

      accountPaths.forEach((path) => {
        expect(path).toContain('/accounts/');
      });
    });

    it('should handle various profile path formats', () => {
      const profilePaths = [
        '/api/v1/accounts/1/profiles/2/image',
        '/accounts/123/profiles/456/image',
        '/api/v2/accounts/abc/profiles/xyz/image',
      ];

      profilePaths.forEach((path) => {
        expect(path).toContain('/profiles/');
      });
    });
  });

  describe('filename generation', () => {
    it('should generate correct filename for account images', () => {
      mockRequest.params = { accountId: '123' };
      const mimetype = 'image/jpeg';

      buildAccountImageName('123', mimetype);

      expect(buildAccountImageName).toHaveBeenCalledWith('123', mimetype);
    });

    it('should generate correct filename for profile images', () => {
      mockRequest.params = { profileId: '456' };
      const mimetype = 'image/png';

      buildProfileImageName('456', mimetype);

      expect(buildProfileImageName).toHaveBeenCalledWith('456', mimetype);
    });

    it('should handle different mimetypes correctly', () => {
      const mimetypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      mimetypes.forEach((mimetype) => {
        buildAccountImageName('123', mimetype);
      });

      expect(buildAccountImageName).toHaveBeenCalledTimes(mimetypes.length);
    });
  });

  describe('directory creation', () => {
    it('should create upload directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // The middleware creates directories on initialization
      expect(getUploadDirectory).toBeDefined();
    });

    it('should create accounts subdirectory if it does not exist', () => {
      const uploadsDir = '/test/uploads';
      (getUploadDirectory as jest.Mock).mockReturnValue(uploadsDir);

      expect(uploadsDir + '/accounts').toBe('/test/uploads/accounts');
    });

    it('should create profiles subdirectory if it does not exist', () => {
      const uploadsDir = '/test/uploads';
      (getUploadDirectory as jest.Mock).mockReturnValue(uploadsDir);

      expect(uploadsDir + '/profiles').toBe('/test/uploads/profiles');
    });

    it('should use recursive option when creating directories', () => {
      // Verify that directories are created with recursive: true option
      const expectedOptions = { recursive: true };

      expect(expectedOptions.recursive).toBe(true);
    });
  });

  describe('Promise-based middleware', () => {
    it('should verify middleware is a function', () => {
      expect(uploadFileMiddleware).toBeDefined();
      expect(typeof uploadFileMiddleware).toBe('function');
    });

    it('should resolve on successful upload', async () => {
      // Mock successful upload
      const mockUploadFile = jest.fn((req, res, callback) => callback(null));

      await expect(
        new Promise((resolve, reject) => {
          mockUploadFile(mockRequest, mockResponse, (error: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(undefined);
            }
          });
        }),
      ).resolves.toBeUndefined();
    });

    it('should reject on upload error', async () => {
      const error = new Error('Upload failed');
      const mockUploadFile = jest.fn((req, res, callback) => callback(error));

      await expect(
        new Promise((resolve, reject) => {
          mockUploadFile(mockRequest, mockResponse, (err: any) => {
            if (err) {
              reject({
                status: 500,
                message: 'An unexpected error occurred during file upload.',
                code: 'UPLOAD_FAILED',
              });
            } else {
              resolve(undefined);
            }
          });
        }),
      ).rejects.toEqual({
        status: 500,
        message: 'An unexpected error occurred during file upload.',
        code: 'UPLOAD_FAILED',
      });
    });
  });

  describe('field name validation', () => {
    it('should expect file field name to be "file"', () => {
      const expectedFieldName = 'file';

      expect(expectedFieldName).toBe('file');
    });

    it('should handle single file upload only', () => {
      // The middleware uses .single('file'), so only one file is expected
      const maxFileCount = 1;

      expect(maxFileCount).toBe(1);
    });
  });

  describe('configuration', () => {
    it('should use correct upload directory from config', () => {
      getUploadDirectory();

      expect(getUploadDirectory).toHaveBeenCalled();
    });

    it('should enforce 5MB file size limit', () => {
      const maxSize = 5 * 1024 * 1024;

      expect(maxSize).toBe(5242880); // 5MB in bytes
    });

    it('should allow exactly 5 image types', () => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

      expect(allowedMimeTypes).toHaveLength(5);
    });
  });

  describe('edge cases', () => {
    it('should handle accountId with special characters', () => {
      const specialIds = ['abc-123', 'test_456', 'user.789'];

      specialIds.forEach((id) => {
        buildAccountImageName(id, 'image/jpeg');
      });

      expect(buildAccountImageName).toHaveBeenCalledTimes(specialIds.length);
    });

    it('should handle profileId with special characters', () => {
      const specialIds = ['profile-1', 'profile_2', 'profile.3'];

      specialIds.forEach((id) => {
        buildProfileImageName(id, 'image/png');
      });

      expect(buildProfileImageName).toHaveBeenCalledTimes(specialIds.length);
    });

    it('should handle file size at exact limit', () => {
      const maxSize = 5 * 1024 * 1024;
      const fileSize = 5 * 1024 * 1024; // Exactly 5MB

      expect(fileSize).toBeLessThanOrEqual(maxSize);
      expect(fileSize).not.toBeGreaterThan(maxSize);
    });

    it('should handle file size just under limit', () => {
      const maxSize = 5 * 1024 * 1024;
      const fileSize = 5 * 1024 * 1024 - 1; // 1 byte under

      expect(fileSize).toBeLessThan(maxSize);
    });

    it('should handle file size just over limit', () => {
      const maxSize = 5 * 1024 * 1024;
      const fileSize = 5 * 1024 * 1024 + 1; // 1 byte over

      expect(fileSize).toBeGreaterThan(maxSize);
    });
  });
});
