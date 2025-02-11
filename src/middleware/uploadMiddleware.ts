import { buildAccountImageName } from '../utils/imageUtility';
import { Request } from 'express';
import fs from 'fs';
import multer, { StorageEngine } from 'multer';
import path from 'path';
import util from 'util';

const DEFAULT_UPLOADS_DIR = path.join(process.cwd(), 'uploads');
export const UPLOADS_DIR = process.env.UPLOADS_DIR || DEFAULT_UPLOADS_DIR;

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const maxSize: number = 2 * 1024 * 1024;

const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    let destinationPath;
    if (req.path.startsWith('/api/v1/upload/accounts/')) {
      destinationPath = UPLOADS_DIR + '/accounts';
    } else if (req.path.startsWith('/api/v1/upload/profiles/')) {
      destinationPath = UPLOADS_DIR + '/profiles';
    } else {
      destinationPath = UPLOADS_DIR;
    }
    cb(null, destinationPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const { id } = req.params;
    cb(null, buildAccountImageName(id, file.mimetype));
  },
});

const uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single('file');

const uploadFileMiddleware = util.promisify(uploadFile);
export default uploadFileMiddleware;
