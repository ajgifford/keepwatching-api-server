import { updateEpisodeWatchStatus, updateNextEpisodeWatchStatus } from '../controllers/episodesController';
import express from 'express';

const router = express.Router();

router.put('/api/v1/profiles/:profileId/episodes/watchStatus', updateEpisodeWatchStatus);
router.put('/api/v1/profiles/:profileId/episodes/nextWatchStatus', updateNextEpisodeWatchStatus);

export default router;
