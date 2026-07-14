import {
  AccountAndInvitationIdsParams,
  AccountAndProfileIdsParams,
  AccountIdParam,
  ClaimProfileTransferBody,
  ClaimTokenParam,
  CreateProfileTransferInvitationBody,
} from '@ajgifford/keepwatching-common-server/schema';
import { profileTransferService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

/**
 * Invites a profile to be transferred into a brand-new, independent account.
 *
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/transferInvitations
 */
export const createProfileTransferInvitation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId, profileId } = req.params as unknown as AccountAndProfileIdsParams;
      const body: CreateProfileTransferInvitationBody = req.body;

      const invitation = await profileTransferService.createInvitation(accountId, profileId, body);

      res.status(201).json({
        message: 'Profile transfer invitation sent successfully',
        invitation,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Lists all profile transfer invitations created by an account.
 *
 * @route GET /api/v1/accounts/:accountId/transferInvitations
 */
export const getProfileTransferInvitations = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId } = req.params as unknown as AccountIdParam;

      const invitations = await profileTransferService.listInvitationsByAccount(accountId);

      res.status(200).json({
        message: `Retrieved profile transfer invitations for account ${accountId}`,
        invitations,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Cancels a pending profile transfer invitation.
 *
 * @route DELETE /api/v1/accounts/:accountId/transferInvitations/:invitationId
 */
export const cancelProfileTransferInvitation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId, invitationId } = req.params as unknown as AccountAndInvitationIdsParams;

      await profileTransferService.cancelInvitation(invitationId, accountId);

      res.status(200).json({ message: 'Profile transfer invitation canceled successfully' });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Public, pre-authentication preview of a pending invitation for the claim page.
 *
 * @route GET /api/v1/profileTransferInvitations/:token
 */
export const getProfileTransferInvitationPreview = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params as unknown as ClaimTokenParam;

      const preview = await profileTransferService.getInvitationPreview(token);

      res.status(200).json({
        message: 'Retrieved profile transfer invitation preview',
        preview,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Claims a pending profile transfer invitation, creating a new account for the
 * already-authenticated Firebase user and re-parenting the invited profile to it.
 *
 * @route POST /api/v1/profileTransferInvitations/:token/claim
 */
export const claimProfileTransferInvitation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params as unknown as ClaimTokenParam;
      const { name }: ClaimProfileTransferBody = req.body;
      const uid = req.user!.uid;
      const email = req.user!.email!;

      const account = await profileTransferService.claimInvitation(token, uid, email, name);

      res.status(200).json({
        message: 'Profile transfer invitation claimed successfully',
        account,
      });
    } catch (error) {
      next(error);
    }
  },
);
