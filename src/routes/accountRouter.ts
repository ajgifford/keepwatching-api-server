import { editAccount, googleLogin, login, logout, register } from '../controllers/accountController';
import { authenticateUser } from '../middleware/authenticationMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server/middleware/validationMiddleware';
import {
  accountIdParamSchema,
  accountSchema,
  accountUpdateSchema,
  googleLoginSchema,
  loginSchema,
} from '@ajgifford/keepwatching-common-server/schema/accountSchema';
import express from 'express';

const router = express.Router();

router.post('/api/v1/accounts/register', validateSchema(accountSchema), register);
router.post('/api/v1/accounts/login', validateSchema(loginSchema), login);
router.post('/api/v1/accounts/googleLogin', validateSchema(googleLoginSchema), googleLogin);
router.post('/api/v1/accounts/logout', logout);
router.put(
  '/api/v1/accounts/:accountId',
  validateSchema(accountIdParamSchema, 'params'),
  authenticateUser,
  authorizeAccountAccess,
  validateRequest(accountUpdateSchema),
  editAccount,
);

export default router;
