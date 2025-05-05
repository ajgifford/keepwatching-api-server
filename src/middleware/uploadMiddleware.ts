import { getUploadDirectory } from '@ajgifford/keepwatching-common-server/config';
import { buildAccountImageName, buildProfileImageName } from '@ajgifford/keepwatching-common-server/utils';
import { Request } from 'express';
import fs from 'fs';
import multer, { StorageEngine } from 'multer';
import util from 'util';

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

const maxSize: number = 2 * 1024 * 1024;

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
}).single('file');

const uploadFileMiddleware = util.promisify(uploadFile);
export default uploadFileMiddleware;
