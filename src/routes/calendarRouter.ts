import { getCalendarContent } from '../controllers/calendarController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import { accountAndProfileIdsParamSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/calendar',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  trackAccountActivity,
  getCalendarContent,
);

export default router;
