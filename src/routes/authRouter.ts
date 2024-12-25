import { authenticateUser, logoutUser, registerUser } from '../controllers/authController';
import express from 'express';

const router = express.Router();

router.post('/api/account', registerUser);
router.post('/api/login', authenticateUser);
router.post('/api/logout', logoutUser);

export default router;
