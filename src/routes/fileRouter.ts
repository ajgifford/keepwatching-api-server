import { download, upload } from '../controllers/fileController';
import express from 'express';

const router = express.Router();

router.post('/api/upload/account/:id', upload);
router.get('/api/download/:name', download);

export default router;
