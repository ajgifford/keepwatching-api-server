import {
  addFavorite,
  getNextWatchForProfile,
  getShowDetails,
  getShows,
  removeFavorite,
  updateShowWatchStatus,
  updateShows,
} from '../controllers/showsController';
import express from 'express';

const router = express.Router();

router.get('/api/profiles/:profileId/shows', getShows);
router.post('/api/profiles/:profileId/shows/favorites', addFavorite);
router.delete('/api/profiles/:profileId/shows/favorites/:showId', removeFavorite);
router.put('/api/profiles/:profileId/shows/watchstatus', updateShowWatchStatus);
router.get('/api/profiles/:profileId/shows/:showId/details', getShowDetails);
router.get('/api/profiles/:profileId/shows/nextWatch', getNextWatchForProfile);
router.post('/api/updateShows', updateShows);

export default router;
