import { discoverTopShows } from '../controllers/discoverController';
import { validateSchema } from '../middleware/validationMiddleware';
import { discoverTopQuerySchema } from '../schema/discoverSchema';
import express from 'express';

const router = express.Router();

router.get('/api/v1/discover/top', validateSchema(discoverTopQuerySchema), discoverTopShows);

export default router;
