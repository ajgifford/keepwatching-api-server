import { searchShow } from '../controllers/searchController';
import express from 'express';

const router = express.Router();

router.get('/api/search/show', searchShow);

export default router;
