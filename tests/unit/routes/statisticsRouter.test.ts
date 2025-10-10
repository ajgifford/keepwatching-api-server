import router from '@routes/statisticsRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/statisticsController', () => ({
  getAccountStatistics: jest.fn((_req, res) => res.status(200).send('account statistics')),
  getProfileStatistics: jest.fn((_req, res) => res.status(200).send('profile statistics')),
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

describe('Statistics Router', () => {
  it('GET /api/v1/accounts/:accountId/statistics', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics');
    expect(res.status).toBe(200);
    expect(res.text).toBe('account statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics');
    expect(res.status).toBe(200);
    expect(res.text).toBe('profile statistics');
  });
});
