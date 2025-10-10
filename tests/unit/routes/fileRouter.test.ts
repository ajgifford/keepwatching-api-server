import router from '@routes/fileRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/fileController', () => ({
  uploadAccountImage: jest.fn((_req, res) => res.status(200).send('account image uploaded')),
  uploadProfileImage: jest.fn((_req, res) => res.status(200).send('profile image uploaded')),
  deleteAccountImage: jest.fn((_req, res) => res.status(200).send('account image deleted')),
  deleteProfileImage: jest.fn((_req, res) => res.status(200).send('profile image deleted')),
}));

jest.mock('@middleware/accountActivityMiddleware', () => ({
  trackAccountActivity: (_req: any, _res: any, next: () => any) => next(),
}));

jest.mock('@middleware/authorizationMiddleware', () => ({
  authorizeAccountAccess: (_req: any, _res: any, next: () => any) => next(),
}));

jest.mock('@ajgifford/keepwatching-common-server', () => ({
  validateSchema: () => (_req: any, _res: any, next: () => any) => next(),
}));

const app = express();
app.use(express.json());
app.use(router);

describe('File Router', () => {
  it('POST /api/v1/upload/accounts/:accountId', async () => {
    const res = await request(app).post('/api/v1/upload/accounts/123').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('account image uploaded');
  });

  it('POST /api/v1/upload/accounts/:accountId/profiles/:profileId', async () => {
    const res = await request(app).post('/api/v1/upload/accounts/123/profiles/456').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('profile image uploaded');
  });

  it('DELETE /api/v1/upload/accounts/:accountId/image', async () => {
    const res = await request(app).delete('/api/v1/upload/accounts/123/image');
    expect(res.status).toBe(200);
    expect(res.text).toBe('account image deleted');
  });

  it('DELETE /api/v1/upload/accounts/:accountId/profiles/:profileId/image', async () => {
    const res = await request(app).delete('/api/v1/upload/accounts/123/profiles/456/image');
    expect(res.status).toBe(200);
    expect(res.text).toBe('profile image deleted');
  });
});
