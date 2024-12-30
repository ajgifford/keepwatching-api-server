import { addFavorite, updateWatchStatus } from '../controllers/showsController';
import express from 'express';

const router = express.Router();

router.post('/api/profiles/:profileId/shows/favorites', addFavorite);
router.put('/api/profiles/:profileId/shows/watchstatus', updateWatchStatus);

export default router;
