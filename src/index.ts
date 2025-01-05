import 'dotenv/config';

import { authenticate } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorMiddleware';
import { sampleAccount, sampleProfiles } from './mock_data/mock_account';
import { sampleMovies } from './mock_data/mock_movies';
import {
  sampleEpisodes,
  sampleSeasons,
  sampleShow,
  sampleShows,
  sampleShowsWithProfiles,
  sampleShows_2,
  sampleShows_3,
} from './mock_data/mock_shows';
import authRouter from './routes/authRouter';
import discoverRouter from './routes/discoverRouter';
import moviesRouter from './routes/moviesRouter';
import profilesRouter from './routes/profilesRouter';
import searchRouter from './routes/searchRouter';
import showsRouter from './routes/showsRouter';
import { getCachedStreamingServiceIds, loadStreamingService } from './utils/wacthProvidersUtility';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import multer from 'multer';

const app: Express = express();
const port = process.env.PORT || 3000;

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
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(authRouter);
app.use(profilesRouter);
app.use(searchRouter);
app.use(discoverRouter);
app.use(showsRouter);
app.use(moviesRouter);
app.use(cookieParser());

app.use(errorHandler);

// File upload setup
const upload = multer({ dest: 'uploads/' });

app.get('/', (req: Request, res: Response) => {
  res.send('KeepWatching API');
});

const startServer = async () => {
  try {
    console.log('Fetching initial data from the database...');
    await loadStreamingService();
    console.log('Data fetched and cached successfully.');

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
};

startServer();
