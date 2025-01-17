import {
  addProfile,
  deleteProfile,
  editAccount,
  editProfile,
  getProfile,
  getProfiles,
} from '../controllers/accountController';
import express from 'express';

const router = express.Router();

router.put('/api/accounts/:id', editAccount);
router.get('/api/accounts/:id/profiles', getProfiles);
router.get('/api/accounts/:id/profiles/:profileId', getProfile);
router.post('/api/accounts/:id/profiles', addProfile);
router.put('/api/accounts/:id/profiles/:profileId', editProfile);
router.delete('/api/accounts/:id/profiles/:profileId', deleteProfile);

export default router;
