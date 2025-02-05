import { googleLogin, login, register } from '../controllers/authController';
import { validateEmail, validateName, validateUID } from '../middleware/validationMiddleware';
import express from 'express';

const router = express.Router();

router.post('/api/v1/accounts', validateName, validateUID, validateEmail, register);
router.post('/api/v1/login', validateUID, login);
router.post('/api/v1/googleLogin', validateName, validateUID, googleLogin);

export default router;
