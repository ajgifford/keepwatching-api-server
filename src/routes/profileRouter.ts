import { addProfile, deleteProfile, editProfile, getProfile, getProfiles } from '../controllers/profileController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  accountAndProfileIdsParamSchema,
  accountIdParamSchema,
  profileNameBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getProfiles,
);
router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getProfile,
);
router.post(
  '/api/v1/accounts/:accountId/profiles',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(profileNameBodySchema),
  trackAccountActivity,
  addProfile,
);
router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(profileNameBodySchema),
  trackAccountActivity,
  editProfile,
);
router.delete(
  '/api/v1/accounts/:accountId/profiles/:profileId',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  deleteProfile,
);

export default router;
