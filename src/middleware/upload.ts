import { __basedir } from '..';
import { buildAccountImageName } from '../utils/imageUtility';
import { Request } from 'express';
import multer, { StorageEngine } from 'multer';
import util from 'util';

const maxSize: number = 2 * 1024 * 1024;

const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    let destinationPath;
    if (req.path.startsWith('/api/upload/accounts/')) {
      destinationPath = __basedir + '/uploads/accounts';
    } else if (req.path.startsWith('/api/upload/profiles/')) {
      destinationPath = __basedir + '/uploads/profiles';
    } else {
      destinationPath = __basedir + '/uploads'; // Fallback directory
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
