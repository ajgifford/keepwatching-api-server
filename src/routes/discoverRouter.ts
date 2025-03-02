import { discoverTopContent, discoverTrendingContent } from '../controllers/discoverController';
import { validateSchema } from '../middleware/validationMiddleware';
import { discoverTopQuerySchema, discoverTrendingQuerySchema } from '../schema/discoverSchema';
import express from 'express';

const router = express.Router();

router.get('/api/v1/discover/top', validateSchema(discoverTopQuerySchema), discoverTopContent);
router.get('/api/v1/discover/trending', validateSchema(discoverTrendingQuerySchema), discoverTrendingContent);

export default router;
