import { addFavorite, getShows, updateWatchStatus } from '../controllers/showsController';
import express from 'express';

const router = express.Router();

router.get('/api/profiles/:profileId/shows', getShows);
router.post('/api/profiles/:profileId/shows/favorites', addFavorite);
router.put('/api/profiles/:profileId/shows/watchstatus', updateWatchStatus);

export default router;
