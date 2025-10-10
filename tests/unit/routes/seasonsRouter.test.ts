import router from '@routes/seasonsRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/seasonsController', () => ({
  updateSeasonWatchStatus: jest.fn((_req, res) => res.status(200).send('season watch status updated')),
  getSeasonsForShow: jest.fn((_req, res) => res.status(200).send('seasons for show')),
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

describe('Seasons Router', () => {
  it('PUT /api/v1/accounts/:accountId/profiles/:profileId/seasons/watchstatus', async () => {
    const res = await request(app).put('/api/v1/accounts/123/profiles/456/seasons/watchstatus').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('season watch status updated');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/seasons', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/shows/789/seasons');
    expect(res.status).toBe(200);
    expect(res.text).toBe('seasons for show');
  });
});
