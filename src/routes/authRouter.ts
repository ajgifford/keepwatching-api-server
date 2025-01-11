import { login, logout, register } from '../controllers/authController';
import { validateEmail, validateName, validatePassword } from '../middleware/validationMiddleware';
import express from 'express';

const router = express.Router();

router.post('/api/accounts', validateName, validateEmail, validatePassword, register);
router.post('/api/login', validateEmail, validatePassword, login);
router.post('/api/logout', logout);

export default router;
