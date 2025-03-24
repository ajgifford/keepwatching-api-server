import { uploadAccountImage, uploadProfileImage } from '../controllers/fileController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '../middleware/validationMiddleware';
import { accountAndProfileIdsParamSchema, accountIdParamSchema } from '../schema/accountSchema';
import express from 'express';

const router = express.Router();

router.post('/api/v1/upload/accounts/:accountId', validateSchema(accountIdParamSchema, 'params'), uploadAccountImage);
router.post(
  '/api/v1/upload/accounts/:accountId/profiles/:profileId',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  uploadProfileImage,
);

export default router;
