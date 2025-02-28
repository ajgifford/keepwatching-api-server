import { searchMovies, searchShows } from '../controllers/searchController';
import { validateSearchParams } from '../middleware/searchValidationMiddleware';
import express from 'express';

const router = express.Router();

router.get('/api/v1/search/shows', validateSearchParams, searchShows);
router.get('/api/v1/search/movies', validateSearchParams, searchMovies);

export default router;
