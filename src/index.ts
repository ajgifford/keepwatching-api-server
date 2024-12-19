import { sampleAccount } from './mock_data/mock_account';
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
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import multer from 'multer';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
let autoId: number = 100;

// Middleware
app.use(cors());
app.use(bodyParser.json());

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

app.get('/api/account/:accountId/shows', async (req: Request, res: Response) => {
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

app.get('/api/account/:id', (req: Request, res: Response) => {
  // res.header('Access-Control-Allow-Origin', '*');
  res.json(sampleAccount);
});

app.put('/api/account', (req, res) => {
  console.log('PUT /api/account', req.body);
  res.send(`Got a PUT request at /api/account with body: ${req.body.name}`);
});

// Adding a new profile
app.post('/api/account/:id/profiles', (req, res) => {
  const { id } = req.params;
  console.log(`PUT /api/account/${id}/profiles`, req.body);
  res.json(JSON.stringify({ id: `${autoId++}`, name: req.body.name }));
});

// Deleing a profile
app.delete('/api/account/:id/profiles/:profileId', (req, res) => {
  const { id, profileId } = req.params;
  console.log(`DELETE /api/account/${id}/profiles/${profileId}`);
  res.status(204).send();
});

app.patch('/api/account/:id', (req, res) => {
  const { id } = req.params;
  res.send(`Got a PATCH request at /api/account/${id}`);
});

app.listen(port, (err?: Error) => {
  if (err) {
    console.log(err);
  }
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
