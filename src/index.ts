import 'dotenv/config';

import { initScheduledJobs } from './controllers/changesController';
import { cliLogger, httpLogger } from './logger/logger';
import { ErrorMessages } from './logger/loggerModel';
import { authenticate } from './middleware/authMiddleware';
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
import fs from 'fs';
import helmet from 'helmet';
import https from 'https';
import path from 'path';

const privateKey = fs.readFileSync('certs/server.key', 'utf8');
const certificate = fs.readFileSync('certs/server.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const app: Express = express();
const port = process.env.PORT || 3000;
export const __basedir = path.resolve(__dirname, '..');

interface AccountBasicInfo {
  id: number;
  name: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      account?: AccountBasicInfo | null;
    }
  }
}

function ensureSecure(req: Request, res: Response, next: NextFunction) {
  if (req.secure) {
    // Request is already secure (HTTPS)
    return next();
  }
  // Redirect to HTTPS version of the URL
  res.redirect('https://' + req.hostname + req.originalUrl);
}

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
app.use(authRouter);
app.use(accountRouter);
app.use(searchRouter);
app.use(discoverRouter);
app.use(showsRouter);
app.use(seasonsRouter);
app.use(epiosdesRouter);
app.use(moviesRouter);
app.use(fileRouter);
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use(ensureSecure);
app.use(errorHandler);

app.get('/', (req: Request, res: Response) => {
  res.send('KeepWatching API');
});

const server = https.createServer(credentials, app);
const startServer = async () => {
  try {
    cliLogger.info('Fetching initial data from the database...');
    await loadStreamingService();
    cliLogger.info('Data fetched and cached successfully.');

    initScheduledJobs();

    server.listen(port, () => {
      cliLogger.info(`Server is running on https://localhost:${port} 🚀🚀🚀`);
    });
  } catch (error) {
    cliLogger.error('Error starting the server! ❌');
    httpLogger.error(ErrorMessages.AppStartupFail, { error });
    process.exit(1);
  }
};

startServer();
