import { discoverTopShows, validateDiscoverQuery } from '../controllers/discoverController';
import express from 'express';

const router = express.Router();

router.get('/api/v1/discover/top', validateDiscoverQuery, discoverTopShows);

export default router;
