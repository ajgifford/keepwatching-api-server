import { upload } from '../controllers/fileController';
import express from 'express';

const router = express.Router();

router.post('/api/upload/account/:id', upload);

export default router;
