import { uploadAccountImage, uploadProfileImage } from '../controllers/fileController';
import express from 'express';

const router = express.Router();

router.post('/api/upload/accounts/:id', uploadAccountImage);
router.post('/api/upload/profiles/:id', uploadProfileImage);

export default router;
