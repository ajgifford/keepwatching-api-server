import {
  dismissBulkMarkedShow,
  getBulkMarkedShows,
  retroactivelyMarkShowAsPrior,
} from '../controllers/watchHistoryController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  accountAndProfileIdsParamSchema,
  watchHistoryDismissBodySchema,
  watchHistoryMarkAsPriorBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/watchHistory/bulkMarked',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  logRequestContext,
  trackAccountActivity,
  getBulkMarkedShows,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/watchHistory/markAsPrior',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(watchHistoryMarkAsPriorBodySchema),
  logRequestContext,
  trackAccountActivity,
  retroactivelyMarkShowAsPrior,
);

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/watchHistory/dismiss',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  validateRequest(watchHistoryDismissBodySchema),
  logRequestContext,
  trackAccountActivity,
  dismissBulkMarkedShow,
);

export default router;
