import { updateSeasonWatchStatus } from '../controllers/seasonsController';
import express from 'express';

const router = express.Router();

router.put('/api/v1/profiles/:profileId/seasons/watchstatus', updateSeasonWatchStatus);

export default router;
