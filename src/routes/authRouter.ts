import { googleLogin, login, register } from '../controllers/authController';
import { validateSchema } from '../middleware/validationMiddleware';
import { accountSchema, googleLoginSchema, loginSchema } from '../schema/accountSchema';
import express from 'express';

const router = express.Router();

router.post('/api/v1/accounts', validateSchema(accountSchema), register);
router.post('/api/v1/login', validateSchema(loginSchema), login);
router.post('/api/v1/googleLogin', validateSchema(googleLoginSchema), googleLogin);

export default router;
