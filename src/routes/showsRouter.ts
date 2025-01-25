import {
  addFavorite,
  getNextWatchForProfile,
  getShowDetails,
  getShows,
  removeFavorite,
  updateShowWatchStatus,
} from '../controllers/showsController';
import express from 'express';

const router = express.Router();

router.get('/api/v1/profiles/:profileId/shows', getShows);
router.post('/api/v1/profiles/:profileId/shows/favorites', addFavorite);
router.delete('/api/v1/profiles/:profileId/shows/favorites/:showId', removeFavorite);
router.put('/api/v1/profiles/:profileId/shows/watchstatus', updateShowWatchStatus);
router.get('/api/v1/profiles/:profileId/shows/:showId/details', getShowDetails);
router.get('/api/v1/profiles/:profileId/shows/nextWatch', getNextWatchForProfile);

export default router;
