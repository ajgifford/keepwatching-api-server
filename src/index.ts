import 'dotenv/config';

import { initScheduledJobs } from './controllers/changesController';
import { cliLogger, httpLogger } from './logger/logger';
import { ErrorMessages } from './logger/loggerModel';
import { authenticateUser } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorMiddleware';
import responseInterceptor from './middleware/loggerMiddleware';
import accountRouter from './routes/accountRouter';
import authRouter from './routes/authRouter';
import discoverRouter from './routes/discoverRouter';
import epiosdesRouter from './routes/episodesRouter';
import fileRouter from './routes/fileRouter';
import moviesRouter from './routes/moviesRouter';
import searchRouter from './routes/searchRouter';
import seasonsRouter from './routes/seasonsRouter';
import showsRouter from './routes/showsRouter';
import { loadStreamingService } from './utils/wacthProvidersUtility';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import fs from 'fs';
import helmet from 'helmet';
import https from 'https';
import path from 'path';
import { Server } from 'socket.io';

const privateKey = fs.readFileSync('certs/server.key', 'utf8');
const certificate = fs.readFileSync('certs/server.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };
export const __basedir = path.resolve(__dirname, '..');

const app: Express = express();
const port = process.env.PORT || 3000;
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__basedir, '/uploads');
const LOG_DIRECTORY = path.resolve(process.env.LOG_DIR || 'logs');

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
  windowMs: 5 * 60 * 1000,
  max: 100,
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
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(responseInterceptor);
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(ensureSecure);
app.use(limiter);

app.use(authRouter);
app.post('/trigger-update', (req, res) => {
  io.emit('globalUpdate', { message: 'Manual update triggered!' });
  res.json({ success: true, message: 'Update event emitted.' });
});

app.use(authenticateUser, accountRouter);
app.use(authenticateUser, searchRouter);
app.use(authenticateUser, discoverRouter);
app.use(authenticateUser, showsRouter);
app.use(authenticateUser, seasonsRouter);
app.use(authenticateUser, epiosdesRouter);
app.use(authenticateUser, moviesRouter);
app.use(authenticateUser, fileRouter);

app.use(errorHandler);

app.get('/', (req: Request, res: Response) => {
  res.send('KeepWatching API');
});

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

    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.data.userId = decodedToken.uid;
    socket.data.email = decodedToken.email;
    next();
  } catch (error) {
    console.error('WebSocket Auth Failed:', error);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  cliLogger.info(`Client connected: ${socket.data.email} - ${socket.data.userId}`);

  socket.on('disconnect', () => {
    cliLogger.info(`Client disconnected: ${socket.data.email} - ${socket.data.userId}`);
  });
});

const startServer = async () => {
  try {
    cliLogger.info('Fetching initial data from the database...');
    await loadStreamingService();
    cliLogger.info('Data fetched and cached successfully.');

    initScheduledJobs(() => {
      io.emit('globalUpdate', { message: 'New updates available!' });
    });

    server.listen(port, () => {
      cliLogger.info(`Server is running on https://localhost:${port} 🚀🚀🚀`);
      cliLogger.info(`Serving uploads from: ${UPLOADS_DIR}`);
      cliLogger.info(`Writing logs to: ${LOG_DIRECTORY}`);
    });
  } catch (error) {
    cliLogger.error('Error starting the server! ❌');
    httpLogger.error(ErrorMessages.AppStartupFail, { error });
    process.exit(1);
  }
};

startServer();
