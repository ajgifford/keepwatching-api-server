import { getPersonDetails, getTMDBPersonCredits, getTMDBPersonDetails } from '../controllers/personController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import { personIdParamSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/person/:personId',
  logRequestContext,
  validateSchema(personIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getPersonDetails,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/tmdbPerson/:personId',
  logRequestContext,
  validateSchema(personIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getTMDBPersonDetails,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/tmdbPerson/:personId/credits',
  logRequestContext,
  validateSchema(personIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getTMDBPersonCredits,
);

export default router;
