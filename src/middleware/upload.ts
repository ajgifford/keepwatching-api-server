import { __basedir } from '..';
import { buildAccountImageName } from '../utils/imageUtility';
import { Request } from 'express';
import multer, { StorageEngine } from 'multer';
import util from 'util';

const maxSize: number = 2 * 1024 * 1024;

const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, __basedir + '/uploads/');
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
