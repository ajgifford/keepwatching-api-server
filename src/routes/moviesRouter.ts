import { addFavorite, updateWatchStatus } from '../controllers/moviesController';
import express from 'express';

const router = express.Router();

router.post('/api/profiles/:profileId/movies/favorites', addFavorite);
router.put('/api/profiles/:profileId/movies/watchstatus', updateWatchStatus);

export default router;
