import { updateMovies } from '../controllers/changesController';
import { addFavorite, getMovies, removeFavorite, updateMovieWatchStatus } from '../controllers/moviesController';
import express from 'express';

const router = express.Router();

router.get('/api/profiles/:profileId/movies', getMovies);
router.post('/api/profiles/:profileId/movies/favorites', addFavorite);
router.delete('/api/profiles/:profileId/movies/favorites/:movieId', removeFavorite);
router.put('/api/profiles/:profileId/movies/watchstatus', updateMovieWatchStatus);
router.post('/api/updateMovies', updateMovies);

export default router;
