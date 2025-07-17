import { searchMovies, searchPeople, searchShows } from '../controllers/searchController';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { searchQuerySchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get('/api/v1/search/shows', validateSchema(searchQuerySchema, 'query'), searchShows);
router.get('/api/v1/search/movies', validateSchema(searchQuerySchema, 'query'), searchMovies);
router.get('/api/v1/search/people', validateSchema(searchQuerySchema, 'query'), searchPeople);

export default router;
