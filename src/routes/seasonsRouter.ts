import { updateSeasonWatchStatus } from '../controllers/seasonsController';
import express from 'express';

const router = express.Router();

router.put('/api/profiles/:profileId/seasons/watchstatus', updateSeasonWatchStatus);

export default router;
