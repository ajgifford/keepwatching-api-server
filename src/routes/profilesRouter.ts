import { addProfile, deleteProfile, editProfile, getAccountProfiles } from '../controllers/profilesController';
import express from 'express';

const router = express.Router();

router.get('/api/account/:id/profiles', getAccountProfiles);
router.post('/api/account/:id/profiles', addProfile);
router.put('/api/account/:id/profiles/:profileId', editProfile);
router.delete('/api/account/:id/profiles/:profileId', deleteProfile);

export default router;
