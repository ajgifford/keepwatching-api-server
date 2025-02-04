import {
  addProfile,
  deleteProfile,
  editAccount,
  editEmail,
  editProfile,
  getProfile,
  getProfiles,
} from '../controllers/accountController';
import express from 'express';

const router = express.Router();

router.put('/api/v1/accounts/:id', editAccount);
router.put('/api/v1/accounts/:id/email', editEmail);
router.get('/api/v1/accounts/:id/profiles', getProfiles);
router.get('/api/v1/accounts/:id/profiles/:profileId', getProfile);
router.post('/api/v1/accounts/:id/profiles', addProfile);
router.put('/api/v1/accounts/:id/profiles/:profileId', editProfile);
router.delete('/api/v1/accounts/:id/profiles/:profileId', deleteProfile);

export default router;
