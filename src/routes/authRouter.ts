import { login, logout, register } from '../controllers/authController';
import express from 'express';

const router = express.Router();

router.post('/api/accounts', register);
router.post('/api/login', login);
router.post('/api/logout', logout);

export default router;
