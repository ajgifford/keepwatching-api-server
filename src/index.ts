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
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import path from 'path';

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

app.use(errorHandler);

app.get('/', (req: Request, res: Response) => {
  res.send('KeepWatching API');
});

const startServer = async () => {
  try {
    cliLogger.info('Fetching initial data from the database...');
    await loadStreamingService();
    cliLogger.info('Data fetched and cached successfully.');

    initScheduledJobs();

    app.listen(port, () => {
      cliLogger.info(`Server is running on http://localhost:${port} 🚀🚀🚀`);
    });
  } catch (error) {
    cliLogger.error('Error starting the server! ❌');
    httpLogger.error(ErrorMessages.AppStartupFail, { error });
    process.exit(1);
  }
};

startServer();
