import {
  cancelProfileTransferInvitation,
  claimProfileTransferInvitation,
  createProfileTransferInvitation,
  getProfileTransferInvitationPreview,
  getProfileTransferInvitations,
} from '../controllers/profileTransferController';
import { trackAccountActivity } from '../middleware/accountActivityMiddleware';
import { authenticateUser } from '../middleware/authenticationMiddleware';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateRequest, validateSchema } from '@ajgifford/keepwatching-common-server';
import { logRequestContext } from '@ajgifford/keepwatching-common-server/middleware';
import {
  accountAndInvitationIdsParamSchema,
  accountAndProfileIdsParamSchema,
  accountIdParamSchema,
  claimProfileTransferBodySchema,
  claimTokenParamSchema,
  createProfileTransferInvitationBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.post(
  '/api/v1/accounts/:accountId/profiles/:profileId/transferInvitations',
  logRequestContext,
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authenticateUser,
  authorizeAccountAccess,
  validateRequest(createProfileTransferInvitationBodySchema),
  trackAccountActivity,
  createProfileTransferInvitation,
);
router.get(
  '/api/v1/accounts/:accountId/transferInvitations',
  logRequestContext,
  validateSchema(accountIdParamSchema, 'params'),
  authenticateUser,
  authorizeAccountAccess,
  trackAccountActivity,
  getProfileTransferInvitations,
);
router.delete(
  '/api/v1/accounts/:accountId/transferInvitations/:invitationId',
  logRequestContext,
  validateSchema(accountAndInvitationIdsParamSchema, 'params'),
  authenticateUser,
  authorizeAccountAccess,
  trackAccountActivity,
  cancelProfileTransferInvitation,
);
router.get(
  '/api/v1/profileTransferInvitations/:token',
  logRequestContext,
  validateSchema(claimTokenParamSchema, 'params'),
  getProfileTransferInvitationPreview,
);
router.post(
  '/api/v1/profileTransferInvitations/:token/claim',
  logRequestContext,
  validateSchema(claimTokenParamSchema, 'params'),
  authenticateUser,
  validateRequest(claimProfileTransferBodySchema),
  claimProfileTransferInvitation,
);

export default router;
