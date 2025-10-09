import {
  deleteAccountImage,
  deleteProfileImage,
  uploadAccountImage,
  uploadProfileImage,
} from '../controllers/fileController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { accountAndProfileIdsParamSchema, accountIdParamSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.post(
  '/api/v1/upload/accounts/:accountId',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  uploadAccountImage,
);

router.post(
  '/api/v1/upload/accounts/:accountId/profiles/:profileId',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  uploadProfileImage,
);

router.delete(
  '/api/v1/upload/accounts/:accountId/image',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  deleteAccountImage,
);

router.delete(
  '/api/v1/upload/accounts/:accountId/profiles/:profileId/image',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  deleteProfileImage,
);

export default router;
