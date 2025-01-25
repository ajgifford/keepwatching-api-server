import { searchMovies, searchShows } from '../controllers/searchController';
import express from 'express';

const router = express.Router();

router.get('/api/v1/search/shows', searchShows);
router.get('/api/v1/search/movies', searchMovies);

export default router;
