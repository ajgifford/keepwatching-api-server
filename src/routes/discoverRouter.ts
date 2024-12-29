import { discoverTopShows } from '../controllers/discoverController';
import express from 'express';

const router = express.Router();

router.get('/api/discover/top', discoverTopShows);

export default router;
