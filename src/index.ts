import 'module-alias/register';

import 'dotenv/config';

import { authenticateUser } from './middleware/authenticationMiddleware';
import accountRouter from './routes/accountRouter';
import discoverRouter from './routes/discoverRouter';
import episodesRouter from './routes/episodesRouter';
import fileRouter from './routes/fileRouter';
import moviesRouter from './routes/moviesRouter';
import notificationsRouter from './routes/notificationsRouter';
import profileRouter from './routes/profileRouter';
import searchRouter from './routes/searchRouter';
import seasonsRouter from './routes/seasonsRouter';
import showsRouter from './routes/showsRouter';
import statisticsRouter from './routes/statisticsRouter';
import { errorHandler } from '@ajgifford/keepwatching-common-server';
import {
  getAppVersion,
  getCertsKeyPath,
  getCertsServerPath,
  getLogDirectory,
  getPort,
  getRateLimitMax,
  getRateLimitTimeWindow,
  getUploadDirectory,
} from '@ajgifford/keepwatching-common-server/config';
import { ErrorMessages, appLogger, cliLogger } from '@ajgifford/keepwatching-common-server/logger';
import { responseInterceptor } from '@ajgifford/keepwatching-common-server/middleware';
import { databaseService, socketService } from '@ajgifford/keepwatching-common-server/services';
import { initScheduledJobs, shutdownJobs } from '@ajgifford/keepwatching-common-server/services';
import { loadStreamingService } from '@ajgifford/keepwatching-common-server/utils';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import fs from 'fs';
import helmet from 'helmet';
import https from 'https';
import { Server } from 'socket.io';

const KEY_PATH = getCertsKeyPath();
const CERT_PATH = getCertsServerPath();

const credentials = {
  key: fs.readFileSync(KEY_PATH),
  cert: fs.readFileSync(CERT_PATH),
};

const app: Express = express();
const port = getPort();
const UPLOADS_DIR = getUploadDirectory();
const LOG_DIRECTORY = getLogDirectory();

declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

function ensureSecure(req: Request, res: Response, next: NextFunction) {
  if (req.secure) {
    return next();
  }
  res.redirect('https://' + req.hostname + req.originalUrl);
}

const limiter = rateLimit({
  windowMs: getRateLimitTimeWindow(),
  max: getRateLimitMax(),
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);

// Security middleware to ensure only local connections
app.use((req: Request, res: Response, next: NextFunction): void => {
  const allowedHosts = ['127.0.0.1', 'localhost', 'keepwatching.giffordfamilydev.us'];
  const host = req.hostname;
  if (!allowedHosts.includes(host)) {
    res.status(403).send('Access Denied');
    return;
  }
  next();
}) as express.RequestHandler;

const blockSuspiciousRequests = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /\.php/i,
    /invokefunction/i,
    /call_user_func/i,
    /eval\(/i,
    /base64_decode/i,
    /system\(/i,
    /exec\(/i,
    /\/\.\./i, // Path traversal
  ];

  const url = req.url.toLowerCase();

  if (suspiciousPatterns.some((pattern) => pattern.test(url))) {
    appLogger.warn('Blocked suspicious request', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
    });
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
};

app.use(blockSuspiciousRequests);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(responseInterceptor);
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(ensureSecure);
app.use(limiter);

app.use(errorHandler);

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'KeepWatching API',
    status: 'running',
    version: getAppVersion(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: getAppVersion(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(accountRouter);
app.use(authenticateUser, profileRouter);
app.use(authenticateUser, searchRouter);
app.use(authenticateUser, discoverRouter);
app.use(authenticateUser, showsRouter);
app.use(authenticateUser, seasonsRouter);
app.use(authenticateUser, episodesRouter);
app.use(authenticateUser, moviesRouter);
app.use(authenticateUser, fileRouter);
app.use(authenticateUser, notificationsRouter);
app.use(authenticateUser, statisticsRouter);

const server = https.createServer(credentials, app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    const account_id = socket.handshake.auth?.account_id;
    if (!account_id) {
      return next(new Error('Authentication error: No account id provided'));
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.data.userId = decodedToken.uid;
    socket.data.email = decodedToken.email;
    socket.data.accountId = account_id;
    next();
  } catch (error) {
    console.error('WebSocket Auth Failed:', error);
    next(new Error('Authentication error'));
  }
});

// Initialize the socket service with our socket.io instance
socketService.initialize(io);

const startServer = async () => {
  try {
    cliLogger.info('Fetching initial data from the database...');
    await loadStreamingService();
    cliLogger.info('Data fetched and cached successfully.');

    initScheduledJobs(
      () => socketService.notifyShowsUpdate(),
      () => socketService.notifyMoviesUpdate(),
    );

    server.listen(port, () => {
      cliLogger.info(`Server is running on https://localhost:${port}`);
      cliLogger.info(`Serving uploads from: ${UPLOADS_DIR}`);
      cliLogger.info(`Writing logs to: ${LOG_DIRECTORY}`);
    });
  } catch (error) {
    cliLogger.error('Error starting the server!');
    appLogger.error(ErrorMessages.AppStartupFail, { error });
    process.exit(1);
  }
};

startServer();

const gracefulShutdown = (signal: string) => {
  cliLogger.info(`Received ${signal}, starting graceful shutdown...`);

  server.close(async () => {
    cliLogger.info('HTTP server closed');

    shutdownJobs();

    try {
      await databaseService.shutdown();
    } catch (err) {
      cliLogger.error('Error during database shutdown', err);
    }

    cliLogger.info('Graceful shutdown complete, exiting process');
    process.exit(0);
  });

  setTimeout(() => {
    cliLogger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
