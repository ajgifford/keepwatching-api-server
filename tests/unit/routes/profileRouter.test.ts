import router from '@routes/profileRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/profileController', () => ({
  getProfiles: jest.fn((_req, res) => res.status(200).send('profiles')),
  getProfile: jest.fn((_req, res) => res.status(200).send('profile')),
  addProfile: jest.fn((_req, res) => res.status(201).send('profile added')),
  editProfile: jest.fn((_req, res) => res.status(200).send('profile edited')),
  deleteProfile: jest.fn((_req, res) => res.status(200).send('profile deleted')),
}));

jest.mock('@middleware/accountActivityMiddleware', () => ({
  trackAccountActivity: (_req: any, _res: any, next: () => any) => next(),
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

describe('Profile Router', () => {
  it('GET /api/v1/accounts/:accountId/profiles', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles');
    expect(res.status).toBe(200);
    expect(res.text).toBe('profiles');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456');
    expect(res.status).toBe(200);
    expect(res.text).toBe('profile');
  });

  it('POST /api/v1/accounts/:accountId/profiles', async () => {
    const res = await request(app).post('/api/v1/accounts/123/profiles').send({});
    expect(res.status).toBe(201);
    expect(res.text).toBe('profile added');
  });

  it('PUT /api/v1/accounts/:accountId/profiles/:profileId', async () => {
    const res = await request(app).put('/api/v1/accounts/123/profiles/456').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('profile edited');
  });

  it('DELETE /api/v1/accounts/:accountId/profiles/:profileId', async () => {
    const res = await request(app).delete('/api/v1/accounts/123/profiles/456');
    expect(res.status).toBe(200);
    expect(res.text).toBe('profile deleted');
  });
});
