import { addFavorite, getSeasons, getShows, updateShowWatchStatus } from '../controllers/showsController';
import express from 'express';

const router = express.Router();

router.get('/api/profiles/:profileId/shows', getShows);
router.post('/api/profiles/:profileId/shows/favorites', addFavorite);
router.put('/api/profiles/:profileId/shows/watchstatus', updateShowWatchStatus);
router.get('/api/profiles/:profileId/shows/:showId/seasons', getSeasons);

export default router;
