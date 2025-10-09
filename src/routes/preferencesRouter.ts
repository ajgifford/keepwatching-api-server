import {
  getAccountPreferences,
  getAccountPreferencesByType,
  updateMultiplePreferences,
  updatePreferences,
} from '../controllers/preferencesController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { accountIdParamSchema, preferenceRouteParamsSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/preferences',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountPreferences,
);

router.get(
  '/api/v1/accounts/:accountId/preferences/:preferenceType',
  validateSchema(preferenceRouteParamsSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getAccountPreferencesByType,
);

router.put(
  '/api/v1/accounts/:accountId/preferences/:preferenceType',
  validateSchema(preferenceRouteParamsSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  updatePreferences,
);

router.put(
  '/api/v1/accounts/:accountId/preferences',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  updateMultiplePreferences,
);

export default router;
