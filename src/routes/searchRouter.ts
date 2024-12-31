import { searchMovies, searchShows } from '../controllers/searchController';
import express from 'express';

const router = express.Router();

router.get('/api/search/shows', searchShows);
router.get('/api/search/movies', searchMovies);

export default router;
