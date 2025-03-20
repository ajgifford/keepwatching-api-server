import {
  addFavorite,
  getMovies,
  getRecentUpcomingForProfile,
  removeFavorite,
  updateMovieWatchStatus,
} from '../controllers/moviesController';
import { validateRequest, validateSchema } from '../middleware/validationMiddleware';
import { addMovieFavoriteSchema, movieWatchStatusSchema, removeMovieFavoriteParamSchema } from '../schema/movieSchema';
import { profileIdParamSchema } from '../schema/profileSchema';
import express from 'express';

const router = express.Router();

router.get('/api/v1/profiles/:profileId/movies', validateSchema(profileIdParamSchema, 'params'), getMovies);
router.post(
  '/api/v1/profiles/:profileId/movies/favorites',
  validateRequest(addMovieFavoriteSchema, profileIdParamSchema),
  addFavorite,
);
router.delete(
  '/api/v1/profiles/:profileId/movies/favorites/:movieId',
  validateSchema(removeMovieFavoriteParamSchema, 'params'),
  removeFavorite,
);
router.put(
  '/api/v1/profiles/:profileId/movies/watchstatus',
  validateRequest(movieWatchStatusSchema, profileIdParamSchema),
  updateMovieWatchStatus,
);
router.get(
  '/api/v1/profiles/:profileId/movies/recentUpcoming',
  validateSchema(profileIdParamSchema, 'params'),
  getRecentUpcomingForProfile,
);

export default router;
