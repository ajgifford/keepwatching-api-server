import { getPersonDetails } from '../controllers/personController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { personIdParamSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/person/:personId',
  validateSchema(personIdParamSchema, 'params'),
  authorizeAccountAccess,
  getPersonDetails,
);

export default router;
