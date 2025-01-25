import { updateEpisodeWatchStatus } from '../controllers/episodesController';
import express from 'express';

const router = express.Router();

router.put('/api/v1/profiles/:profileId/episodes/watchstatus', updateEpisodeWatchStatus);

export default router;
