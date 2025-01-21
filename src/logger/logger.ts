import { randomBytes } from 'crypto';
import winston from 'winston';
import { format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, json, printf, label, colorize } = format;
const timestampFormat: string = 'MMM-DD-YYYY HH:mm:ss';
const generateLogId = (): string => randomBytes(16).toString('hex');
const appVersion = process.env.npm_package_version;

export const httpLogger = winston.createLogger({
  format: combine(
    timestamp({ format: timestampFormat }),
    json(),
    printf(({ timestamp, level, message, ...data }) => {
      const response = {
        level,
        logId: generateLogId(),
        timestamp,
        appInfo: {
          appVersion,
          environment: process.env.NODE_ENV,
          proccessId: process.pid,
        },
        message,
        data,
      };

      return JSON.stringify(response);
    }),
  ),
  defaultMeta: { service: 'keepwatching' },
  transports: [
    new transports.File({ filename: 'logs/keepwatching-error.log', level: 'error' }),
    new DailyRotateFile({
      filename: 'logs/rotating-logs-%DATE%.log',
      datePattern: 'MMMM-DD-YYYY',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

export const cliLogger = winston.createLogger({
  format: combine(
    label({ label: appVersion }),
    timestamp({ format: timestampFormat }),
    colorize({ level: true }),
    printf(({ level, message, label, timestamp }) => `[${timestamp}] ${level} (${label}): ${message}`),
  ),
  transports: [new winston.transports.Console()],
});
