import { discoverTopShows } from '../controllers/discoverController';
import express from 'express';

const router = express.Router();

router.get('/api/v1/discover/top', discoverTopShows);

export default router;
