import { addFavorite } from '../controllers/favoritesController';
import express from 'express';

const router = express.Router();

router.post('/api/accounts/:id/profiles/:profileId/favorites', addFavorite);

export default router;
