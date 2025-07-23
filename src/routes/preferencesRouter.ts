import {
  getAccountPreferences,
  getAccountPreferencesByType,
  updateMultiplePreferences,
  updatePreferences,
} from '../controllers/preferencesController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { accountIdParamSchema, preferenceRouteParamsSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/preferences',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  getAccountPreferences,
);

router.get(
  '/api/v1/accounts/:accountId/preferences/:preferenceType',
  validateSchema(preferenceRouteParamsSchema, 'params'),
  authorizeAccountAccess,
  getAccountPreferencesByType,
);

router.post(
  '/api/v1/accounts/:accountId/preferences/:preferenceType',
  validateSchema(preferenceRouteParamsSchema, 'params'),
  authorizeAccountAccess,
  updatePreferences,
);

router.post(
  '/api/v1/accounts/:accountId/preferences',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  updateMultiplePreferences,
);

export default router;
