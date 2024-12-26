import { addProfile, deleteProfile, editProfile, getAccountProfiles } from '../controllers/profilesController';
import express from 'express';

const router = express.Router();

router.get('/:id/profiles', getAccountProfiles);
router.post('/:id/profiles', addProfile);
router.put('/:id/profiles/:profileId', editProfile);
router.delete('/:id/profiles/:profileId', deleteProfile);

export default router;
