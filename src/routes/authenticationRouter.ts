import { googleLogin, login, logout, register } from '../controllers/authenticationController';
import { validateSchema } from '../middleware/validationMiddleware';
import { accountIdParamSchema, accountSchema, googleLoginSchema, loginSchema } from '../schema/accountSchema';
import express from 'express';

const router = express.Router();

router.post('/api/v1/authentication/register', validateSchema(accountSchema), register);
router.post('/api/v1/authentication/login', validateSchema(loginSchema), login);
router.post('/api/v1/authentication/googleLogin', validateSchema(googleLoginSchema), googleLogin);
router.post('/api/v1/authentication/logout', logout);

export default router;
