import { addProfile, deleteProfile, editProfile, getProfile, getProfiles } from '../controllers/profileController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import {
  accountAndProfileIdsParamSchema,
  accountIdParamSchema,
  profileNameBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  getProfiles,
);
router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  getProfile,
);
router.post(
  '/api/v1/accounts/:accountId/profiles',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(profileNameBodySchema),
  addProfile,
);
router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(profileNameBodySchema),
  editProfile,
);
router.delete(
  '/api/v1/accounts/:accountId/profiles/:profileId',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  deleteProfile,
);

export default router;
