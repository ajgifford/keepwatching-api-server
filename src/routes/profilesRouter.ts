import {
  addFavorite,
  addProfile,
  deleteProfile,
  editProfile,
  getAccountProfiles,
} from '../controllers/profilesController';
import express from 'express';

const router = express.Router();

router.post('/api/accounts/:id/profiles/:profileId/favorites', addFavorite);
router.put('/api/accounts/:id/profiles/:profileId', editProfile);
router.delete('/api/accounts/:id/profiles/:profileId', deleteProfile);
router.get('/api/accounts/:id/profiles', getAccountProfiles);
router.post('/api/accounts/:id/profiles', addProfile);

export default router;
