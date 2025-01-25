import { uploadAccountImage, uploadProfileImage } from '../controllers/fileController';
import express from 'express';

const router = express.Router();

router.post('/api/v1/upload/accounts/:id', uploadAccountImage);
router.post('/api/v1/upload/profiles/:id', uploadProfileImage);

export default router;
