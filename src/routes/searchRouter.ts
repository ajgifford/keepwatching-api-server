import { searchMovies, searchShows } from '../controllers/searchController';
import { validateSchema } from '../middleware/validationMiddleware';
import { searchParamsSchema } from '../schema/searchSchema';
import express from 'express';

const router = express.Router();

router.get('/api/v1/search/shows', validateSchema(searchParamsSchema, 'query'), searchShows);
router.get('/api/v1/search/movies', validateSchema(searchParamsSchema, 'query'), searchMovies);

export default router;
