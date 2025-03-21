import {
  addFavorite,
  getProfileEpisodes,
  getShowDetails,
  getShows,
  removeFavorite,
  updateShowWatchStatus,
} from '../controllers/showsController';
import { validateRequest, validateSchema } from '../middleware/validationMiddleware';
import { profileIdParamSchema } from '../schema/profileSchema';
import { addShowFavoriteSchema, showAndProfileParamSchema, showWatchStatusSchema } from '../schema/showSchema';
import express from 'express';

const router = express.Router();

router.get('/api/v1/profiles/:profileId/shows', validateSchema(profileIdParamSchema, 'params'), getShows);
router.post(
  '/api/v1/profiles/:profileId/shows/favorites',
  validateRequest(addShowFavoriteSchema, profileIdParamSchema),
  addFavorite,
);
router.delete(
  '/api/v1/profiles/:profileId/shows/favorites/:showId',
  validateSchema(showAndProfileParamSchema, 'params'),
  removeFavorite,
);
router.put(
  '/api/v1/profiles/:profileId/shows/watchstatus',
  validateRequest(showWatchStatusSchema, profileIdParamSchema),
  updateShowWatchStatus,
);
router.get(
  '/api/v1/profiles/:profileId/shows/:showId/details',
  validateSchema(showAndProfileParamSchema, 'params'),
  getShowDetails,
);
router.get('/api/v1/profiles/:profileId/episodes', validateSchema(profileIdParamSchema, 'params'), getProfileEpisodes);

export default router;
