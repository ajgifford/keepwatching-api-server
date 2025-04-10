import { addProfile, deleteProfile, editProfile, getProfile, getProfiles } from '../controllers/profileController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '../middleware/validationMiddleware';
import { accountAndProfileIdsParamSchema, accountIdParamSchema, profileNameSchema } from '../schema/accountSchema';
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
  validateRequest(profileNameSchema),
  addProfile,
);
router.put(
  '/api/v1/accounts/:accountId/profiles/:profileId',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(profileNameSchema),
  editProfile,
);
router.delete(
  '/api/v1/accounts/:accountId/profiles/:profileId',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  deleteProfile,
);

export default router;
