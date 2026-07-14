import router from '@routes/profileTransferRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/profileTransferController', () => ({
  createProfileTransferInvitation: jest.fn((_req, res) => res.status(201).send('invitation created')),
  getProfileTransferInvitations: jest.fn((_req, res) => res.status(200).send('invitations listed')),
  cancelProfileTransferInvitation: jest.fn((_req, res) => res.status(200).send('invitation canceled')),
  getProfileTransferInvitationPreview: jest.fn((_req, res) => res.status(200).send('preview')),
  claimProfileTransferInvitation: jest.fn((_req, res) => res.status(200).send('claimed')),
}));

jest.mock('@middleware/accountActivityMiddleware', () => ({
  trackAccountActivity: (_req: any, _res: any, next: () => any) => next(),
}));

jest.mock('@middleware/authenticationMiddleware', () => ({
  authenticateUser: (_req: any, _res: any, next: () => any) => next(),
}));

jest.mock('@middleware/authorizationMiddleware', () => ({
  authorizeAccountAccess: (_req: any, _res: any, next: () => any) => next(),
}));

jest.mock('@ajgifford/keepwatching-common-server', () => ({
  validateSchema: () => (_req: any, _res: any, next: () => any) => next(),
  validateRequest: () => (_req: any, _res: any, next: () => any) => next(),
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Profile Transfer Router', () => {
  it('POST /api/v1/accounts/:accountId/profiles/:profileId/transferInvitations', async () => {
    const res = await request(app)
      .post('/api/v1/accounts/123/profiles/456/transferInvitations')
      .send({ targetEmail: 'jamie@example.com' });
    expect(res.status).toBe(201);
    expect(res.text).toBe('invitation created');
  });

  it('GET /api/v1/accounts/:accountId/transferInvitations', async () => {
    const res = await request(app).get('/api/v1/accounts/123/transferInvitations');
    expect(res.status).toBe(200);
    expect(res.text).toBe('invitations listed');
  });

  it('DELETE /api/v1/accounts/:accountId/transferInvitations/:invitationId', async () => {
    const res = await request(app).delete('/api/v1/accounts/123/transferInvitations/7');
    expect(res.status).toBe(200);
    expect(res.text).toBe('invitation canceled');
  });

  it('GET /api/v1/profileTransferInvitations/:token', async () => {
    const res = await request(app).get('/api/v1/profileTransferInvitations/raw-token');
    expect(res.status).toBe(200);
    expect(res.text).toBe('preview');
  });

  it('POST /api/v1/profileTransferInvitations/:token/claim', async () => {
    const res = await request(app).post('/api/v1/profileTransferInvitations/raw-token/claim').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('claimed');
  });
});
