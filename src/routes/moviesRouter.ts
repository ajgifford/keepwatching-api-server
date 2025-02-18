import {
  addFavorite,
  getMovies,
  getRecentUpcomingForProfile,
  removeFavorite,
  updateMovieWatchStatus,
} from '../controllers/moviesController';
import express from 'express';

const router = express.Router();

router.get('/api/v1/profiles/:profileId/movies', getMovies);
router.post('/api/v1/profiles/:profileId/movies/favorites', addFavorite);
router.delete('/api/v1/profiles/:profileId/movies/favorites/:movieId', removeFavorite);
router.put('/api/v1/profiles/:profileId/movies/watchstatus', updateMovieWatchStatus);
router.get('/api/v1/profiles/:profileId/movies/recentUpcoming', getRecentUpcomingForProfile);

export default router;
