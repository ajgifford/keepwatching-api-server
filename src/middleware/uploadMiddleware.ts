import { getUploadDirectory } from '@ajgifford/keepwatching-common-server/config';
import { buildAccountImageName, buildProfileImageName } from '@ajgifford/keepwatching-common-server/utils';
import { Request, Response } from 'express';
import fs from 'fs';
import multer, { MulterError, StorageEngine } from 'multer';

const UPLOADS_DIR = getUploadDirectory();

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOADS_DIR + '/accounts')) {
  fs.mkdirSync(UPLOADS_DIR + '/accounts', { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR + '/profiles')) {
  fs.mkdirSync(UPLOADS_DIR + '/profiles', { recursive: true });
}

const maxSize: number = 5 * 1024 * 1024; // 5MB

const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    let destinationPath;
    if (req.path.includes('/profiles/')) {
      destinationPath = UPLOADS_DIR + '/profiles';
    } else {
      destinationPath = UPLOADS_DIR + '/accounts';
    }
    cb(null, destinationPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    if (req.path.includes('/profiles/')) {
      const { profileId } = req.params;
      const fileName = buildProfileImageName(profileId, file.mimetype);
      cb(null, fileName);
    } else {
      const { accountId } = req.params;
      const fileName = buildAccountImageName(accountId, file.mimetype);
      cb(null, fileName);
    }
  },
});

const uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Optional: Add file type validation
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  },
}).single('file');

// Enhanced upload middleware with proper error handling
const uploadFileMiddleware = (req: Request, res: Response): Promise<void> => {
  return new Promise((resolve, reject) => {
    uploadFile(req, res, (error: any) => {
      if (error) {
        // Handle Multer-specific errors
        if (error instanceof MulterError) {
          switch (error.code) {
            case 'LIMIT_FILE_SIZE':
              return reject({
                status: 413,
                message: 'File too large. Maximum file size is 5MB.',
                code: 'FILE_TOO_LARGE',
              });
            case 'LIMIT_FILE_COUNT':
              return reject({
                status: 400,
                message: 'Too many files. Only one file is allowed.',
                code: 'TOO_MANY_FILES',
              });
            case 'LIMIT_UNEXPECTED_FILE':
              return reject({
                status: 400,
                message: 'Unexpected file field. Use "file" as the field name.',
                code: 'UNEXPECTED_FILE_FIELD',
              });
            default:
              return reject({
                status: 400,
                message: `Upload error: ${error.message}`,
                code: 'UPLOAD_ERROR',
              });
          }
        }

        // Handle file filter errors (invalid file type)
        if (error.message.includes('Invalid file type')) {
          return reject({
            status: 400,
            message: error.message,
            code: 'INVALID_FILE_TYPE',
          });
        }

        // Handle other errors
        return reject({
          status: 500,
          message: 'An unexpected error occurred during file upload.',
          code: 'UPLOAD_FAILED',
        });
      }

      resolve();
    });
  });
};

export default uploadFileMiddleware;
