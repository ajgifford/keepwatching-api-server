import { deleteAccount, editAccount, googleLogin, login, logout, register } from '../controllers/accountController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authenticateUser } from '../middleware/authenticationMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import {
  accountIdParamSchema,
  accountLoginBodySchema,
  googleLoginBodySchema,
  registerAccountBodySchema,
  updateAccountBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.post('/api/v1/accounts/register', validateSchema(registerAccountBodySchema), register);
router.post('/api/v1/accounts/login', validateSchema(accountLoginBodySchema), login);
router.post('/api/v1/accounts/googleLogin', validateSchema(googleLoginBodySchema), googleLogin);
router.post('/api/v1/accounts/logout', logout);
router.put(
  '/api/v1/accounts/:accountId',
  validateSchema(accountIdParamSchema, 'params'),
  authenticateUser,
  authorizeAccountAccess,
  validateRequest(updateAccountBodySchema),
  trackAccountActivity,
  editAccount,
);
router.delete('/api/v1/accounts/:accountId', validateSchema(accountIdParamSchema, 'params'), deleteAccount);

export default router;
