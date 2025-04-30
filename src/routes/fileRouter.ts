import { uploadAccountImage, uploadProfileImage } from '../controllers/fileController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { accountAndProfileIdsParamSchema, accountIdParamSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.post(
  '/api/v1/upload/accounts/:accountId',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  uploadAccountImage,
);

router.post(
  '/api/v1/upload/accounts/:accountId/profiles/:profileId',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  uploadProfileImage,
);

export default router;
