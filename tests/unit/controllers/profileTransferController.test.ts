import { profileTransferService } from '@ajgifford/keepwatching-common-server/services';
import {
  cancelProfileTransferInvitation,
  claimProfileTransferInvitation,
  createProfileTransferInvitation,
  getProfileTransferInvitationPreview,
  getProfileTransferInvitations,
} from '@controllers/profileTransferController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  profileTransferService: {
    createInvitation: jest.fn(),
    listInvitationsByAccount: jest.fn(),
    cancelInvitation: jest.fn(),
    getInvitationPreview: jest.fn(),
    claimInvitation: jest.fn(),
  },
}));

describe('profileTransferController', () => {
  let req: any, res: any, next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { accountId: 1, profileId: 10, invitationId: 7, token: 'raw-token' },
      body: {},
      user: { uid: 'jamie-uid', email: 'jamie@example.com' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('createProfileTransferInvitation', () => {
    it('creates an invitation', async () => {
      req.body = { targetEmail: 'jamie@example.com', targetName: 'Jamie' };
      const invitation = { id: 1, targetEmail: 'jamie@example.com' };
      (profileTransferService.createInvitation as jest.Mock).mockResolvedValue(invitation);

      await createProfileTransferInvitation(req, res, next);

      expect(profileTransferService.createInvitation).toHaveBeenCalledWith(1, 10, req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profile transfer invitation sent successfully',
        invitation,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('handles errors', async () => {
      const error = new Error('failed');
      (profileTransferService.createInvitation as jest.Mock).mockRejectedValue(error);

      await createProfileTransferInvitation(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getProfileTransferInvitations', () => {
    it('lists invitations for an account', async () => {
      const invitations = [{ id: 1 }, { id: 2 }];
      (profileTransferService.listInvitationsByAccount as jest.Mock).mockResolvedValue(invitations);

      await getProfileTransferInvitations(req, res, next);

      expect(profileTransferService.listInvitationsByAccount).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved profile transfer invitations for account 1',
        invitations,
      });
    });

    it('handles errors', async () => {
      const error = new Error('failed');
      (profileTransferService.listInvitationsByAccount as jest.Mock).mockRejectedValue(error);

      await getProfileTransferInvitations(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('cancelProfileTransferInvitation', () => {
    it('cancels an invitation', async () => {
      (profileTransferService.cancelInvitation as jest.Mock).mockResolvedValue(undefined);

      await cancelProfileTransferInvitation(req, res, next);

      expect(profileTransferService.cancelInvitation).toHaveBeenCalledWith(7, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile transfer invitation canceled successfully' });
    });

    it('handles errors', async () => {
      const error = new Error('failed');
      (profileTransferService.cancelInvitation as jest.Mock).mockRejectedValue(error);

      await cancelProfileTransferInvitation(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getProfileTransferInvitationPreview', () => {
    it('returns a preview', async () => {
      const preview = { profileName: "Jamie's Profile", sourceAccountName: 'The Smith Family' };
      (profileTransferService.getInvitationPreview as jest.Mock).mockResolvedValue(preview);

      await getProfileTransferInvitationPreview(req, res, next);

      expect(profileTransferService.getInvitationPreview).toHaveBeenCalledWith('raw-token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved profile transfer invitation preview',
        preview,
      });
    });

    it('handles errors', async () => {
      const error = new Error('failed');
      (profileTransferService.getInvitationPreview as jest.Mock).mockRejectedValue(error);

      await getProfileTransferInvitationPreview(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('claimProfileTransferInvitation', () => {
    it('claims an invitation using the authenticated uid/email', async () => {
      req.body = { name: 'Jamie' };
      const account = { id: 99, name: 'Jamie', email: 'jamie@example.com' };
      (profileTransferService.claimInvitation as jest.Mock).mockResolvedValue(account);

      await claimProfileTransferInvitation(req, res, next);

      expect(profileTransferService.claimInvitation).toHaveBeenCalledWith(
        'raw-token',
        'jamie-uid',
        'jamie@example.com',
        'Jamie',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profile transfer invitation claimed successfully',
        account,
      });
    });

    it('handles errors', async () => {
      const error = new Error('failed');
      (profileTransferService.claimInvitation as jest.Mock).mockRejectedValue(error);

      await claimProfileTransferInvitation(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
