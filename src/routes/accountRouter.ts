import {
  addProfile,
  deleteProfile,
  editAccount,
  editProfile,
  getProfile,
  getProfiles,
} from '../controllers/accountController';
import { validateRequest, validateSchema } from '../middleware/validationMiddleware';
import { accountUpdateSchema, bothIdsParamSchema, idParamSchema, profileNameSchema } from '../schema/accountSchema';
import express from 'express';

const router = express.Router();

router.put('/api/v1/accounts/:id', validateRequest(accountUpdateSchema, idParamSchema), editAccount);
router.get('/api/v1/accounts/:id/profiles', validateSchema(idParamSchema, 'params'), getProfiles);
router.get('/api/v1/accounts/:id/profiles/:profileId', validateSchema(bothIdsParamSchema, 'params'), getProfile);
router.post('/api/v1/accounts/:id/profiles', validateRequest(profileNameSchema, idParamSchema), addProfile);
router.put(
  '/api/v1/accounts/:id/profiles/:profileId',
  validateRequest(profileNameSchema, bothIdsParamSchema),
  editProfile,
);
router.delete('/api/v1/accounts/:id/profiles/:profileId', validateSchema(bothIdsParamSchema, 'params'), deleteProfile);

export default router;
