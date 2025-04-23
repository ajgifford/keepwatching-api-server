import path from 'path';

export function getUploadDirectory() {
  const DEFAULT_UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  return process.env.UPLOADS_DIR || DEFAULT_UPLOADS_DIR;
}

export function getLogDirectory() {
  return path.resolve(process.env.LOG_DIR || 'logs');
}
