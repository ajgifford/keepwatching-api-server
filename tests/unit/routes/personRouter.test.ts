import router from '@routes/personRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/personController', () => ({
  getPersonDetails: jest.fn((_req, res) => res.status(200).send('person details')),
  getTMDBPersonDetails: jest.fn((_req, res) => res.status(200).send('tmdb person details')),
  getTMDBPersonCredits: jest.fn((_req, res) => res.status(200).send('tmdb person credits')),
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

describe('Person Router', () => {
  it('GET /api/v1/accounts/:accountId/profiles/:profileId/person/:personId', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/person/789');
    expect(res.status).toBe(200);
    expect(res.text).toBe('person details');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/tmdbPerson/:personId', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/tmdbPerson/789');
    expect(res.status).toBe(200);
    expect(res.text).toBe('tmdb person details');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/tmdbPerson/:personId/credits', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/tmdbPerson/789/credits');
    expect(res.status).toBe(200);
    expect(res.text).toBe('tmdb person credits');
  });
});
