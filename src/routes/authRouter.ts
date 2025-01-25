import { login, logout, register } from '../controllers/authController';
import { validateEmail, validateName, validatePassword } from '../middleware/validationMiddleware';
import express from 'express';

const router = express.Router();

router.post('/api/v1/accounts', validateName, validateEmail, validatePassword, register);
router.post('/api/v1/login', validateEmail, validatePassword, login);
router.post('/api/v1/logout', logout);

export default router;
