import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import { sampleEpisodes, sampleSeasons, sampleShow, sampleShows } from './mock_data/mock_shows';
import { sampleMovies } from './mock_data/mock_movies';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

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

app.get("/api/seasons/:showId", async (req: Request, res: Response) => {
  const { showId } = req.params;
  res.json(sampleSeasons)
  // try {
  //   const seasons = await db.query("SELECT * FROM Seasons WHERE show_id = ?", [showId]);
  //   res.status(200).json(seasons);
  // } catch (error) {
  //   console.error("Error fetching seasons:", error);
  //   res.status(500).json({ error: "Internal server error" });
  // }
});

app.get("/api/episodes/:seasonId", async (req: Request, res: Response) => {
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
app.get("/api/show/:id", async (req: Request, res: Response) => {
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

app.get('/api/users', (req: Request, res: Response) => {
  res.send('KeepWatching Users');
});

app.put('/api/user', (req, res) => {
  res.send('Got a PUT request at /api/user');
});

app.delete('/api/user', (req, res) => {
  res.send('Got a DELETE request at /api/user');
});

app.patch('/api/user', (req, res) => {
  res.send('Got a PATCH request at /api/user');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
