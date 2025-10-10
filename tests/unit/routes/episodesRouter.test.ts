import router from '@routes/episodesRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/episodesController', () => ({
  updateEpisodeWatchStatus: jest.fn((_req, res) => res.status(200).send('episode watch status updated')),
  getEpisodesForSeason: jest.fn((_req, res) => res.status(200).send('episodes for season')),
  getUpcomingEpisodes: jest.fn((_req, res) => res.status(200).send('upcoming episodes')),
  getRecentEpisodes: jest.fn((_req, res) => res.status(200).send('recent episodes')),
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

describe('Episodes Router', () => {
  it('PUT /api/v1/accounts/:accountId/profiles/:profileId/episodes/watchStatus', async () => {
    const res = await request(app).put('/api/v1/accounts/123/profiles/456/episodes/watchStatus').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('episode watch status updated');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/seasons/:seasonId/episodes', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/seasons/789/episodes');
    expect(res.status).toBe(200);
    expect(res.text).toBe('episodes for season');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/episodes/upcoming', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/episodes/upcoming');
    expect(res.status).toBe(200);
    expect(res.text).toBe('upcoming episodes');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/episodes/recent', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/episodes/recent');
    expect(res.status).toBe(200);
    expect(res.text).toBe('recent episodes');
  });
});
