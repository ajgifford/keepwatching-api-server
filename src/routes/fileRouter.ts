import {
  deleteAccountImage,
  deleteProfileImage,
  uploadAccountImage,
  uploadProfileImage,
} from '../controllers/fileController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import { accountAndProfileIdsParamSchema, accountIdParamSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.post(
  '/api/v1/upload/accounts/:accountId',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  uploadAccountImage,
);

router.post(
  '/api/v1/upload/accounts/:accountId/profiles/:profileId',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  uploadProfileImage,
);

router.delete(
  '/api/v1/upload/accounts/:accountId/image',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  deleteAccountImage,
);

router.delete(
  '/api/v1/upload/accounts/:accountId/profiles/:profileId/image',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  deleteProfileImage,
);

export default router;
