import { searchMovies, searchShows } from '../controllers/searchController';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { searchParamsSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get('/api/v1/search/shows', validateSchema(searchParamsSchema, 'query'), searchShows);
router.get('/api/v1/search/movies', validateSchema(searchParamsSchema, 'query'), searchMovies);

export default router;
