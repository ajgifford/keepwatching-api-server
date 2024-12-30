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
import profilesRouter from './routes/profilesRouter';
import searchRouter from './routes/searchRouter';
import showsRouter from './routes/showsRouter';
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
app.use(cookieParser());

app.use(errorHandler);

// File upload setup
const upload = multer({ dest: 'uploads/' });

app.get('/', (req: Request, res: Response) => {
  res.send('KeepWatching API');
});

app.get('/api/shows', (req, res) => {
  res.json(sampleShows);
});

app.get('/api/shows/:showId', async (req: Request, res: Response) => {
  const { showId } = req.params;
  res.json(sampleShow);
});

app.get('/api/accounts/:accountId/shows', async (req: Request, res: Response) => {
  const { accountId } = req.params;
  res.json(sampleShowsWithProfiles);
});

app.get('/api/shows/profile/:profileId', async (req: Request, res: Response) => {
  const { profileId } = req.params;
  if (profileId == '1') {
    res.json(sampleShows);
  } else if (profileId == '2') {
    res.json(sampleShows_2);
  } else {
    res.json(sampleShows_3);
  }
});

app.get('/api/seasons/:showId', async (req: Request, res: Response) => {
  const { showId } = req.params;
  res.json(sampleSeasons);
  // try {
  //   const seasons = await db.query("SELECT * FROM Seasons WHERE show_id = ?", [showId]);
  //   res.status(200).json(seasons);
  // } catch (error) {
  //   console.error("Error fetching seasons:", error);
  //   res.status(500).json({ error: "Internal server error" });
  // }
});

app.get('/api/episodes/:seasonId', async (req: Request, res: Response) => {
  const { seasonId } = req.params;
  res.json(sampleEpisodes);

  // try {
  //   const episodes = await db.query("SELECT * FROM Episodes WHERE season_id = ?", [seasonId]);
  //   res.status(200).json(episodes);
  // } catch (error) {
  //   console.error("Error fetching episodes:", error);
  //   res.status(500).json({ error: "Internal server error" });
  // }
});

// Endpoint to get a show by its ID with optional seasons and episodes
app.get('/api/show/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { includeSeasons } = req.query;

  // try {
  //   const show = await db.query("SELECT * FROM Shows WHERE id = ?", [id]);

  //   if (!show.length) {
  //     return res.status(404).json({ error: "Show not found" });
  //   }

  //   if (includeSeasons === "true") {
  //     const seasons = await db.query("SELECT * FROM Seasons WHERE show_id = ?", [id]);

  //     for (const season of seasons) {
  //       const episodes = await db.query("SELECT * FROM Episodes WHERE season_id = ?", [season.id]);
  //       season.episodes = episodes;
  //     }

  //     show[0].seasons = seasons;
  //   }

  //   res.status(200).json(show[0]);
  // } catch (error) {
  //   console.error("Error fetching show:", error);
  //   res.status(500).json({ error: "Internal server error" });
  // }
});

app.get('/api/movies', (req, res) => {
  res.json(sampleMovies);
});

app.listen(port, (err?: Error) => {
  if (err) {
    console.log(err);
  }
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
