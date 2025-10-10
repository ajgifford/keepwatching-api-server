import router from '@routes/showsRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/showsController', () => ({
  getShows: jest.fn((_req, res) => res.status(200).send('shows')),
  addFavorite: jest.fn((_req, res) => res.status(201).send('favorite added')),
  removeFavorite: jest.fn((_req, res) => res.status(200).send('favorite removed')),
  updateShowWatchStatus: jest.fn((_req, res) => res.status(200).send('show watch status updated')),
  getShowDetails: jest.fn((_req, res) => res.status(200).send('show details')),
  getProfileEpisodes: jest.fn((_req, res) => res.status(200).send('profile episodes')),
  getShowRecommendations: jest.fn((_req, res) => res.status(200).send('show recommendations')),
  getSimilarShows: jest.fn((_req, res) => res.status(200).send('similar shows')),
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

describe('Shows Router', () => {
  it('GET /api/v1/accounts/:accountId/profiles/:profileId/shows', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/shows');
    expect(res.status).toBe(200);
    expect(res.text).toBe('shows');
  });

  it('POST /api/v1/accounts/:accountId/profiles/:profileId/shows/favorites', async () => {
    const res = await request(app).post('/api/v1/accounts/123/profiles/456/shows/favorites').send({});
    expect(res.status).toBe(201);
    expect(res.text).toBe('favorite added');
  });

  it('DELETE /api/v1/accounts/:accountId/profiles/:profileId/shows/favorites/:showId', async () => {
    const res = await request(app).delete('/api/v1/accounts/123/profiles/456/shows/favorites/789');
    expect(res.status).toBe(200);
    expect(res.text).toBe('favorite removed');
  });

  it('PUT /api/v1/accounts/:accountId/profiles/:profileId/shows/watchstatus', async () => {
    const res = await request(app).put('/api/v1/accounts/123/profiles/456/shows/watchstatus').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('show watch status updated');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/details', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/shows/789/details');
    expect(res.status).toBe(200);
    expect(res.text).toBe('show details');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/episodes', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/episodes');
    expect(res.status).toBe(200);
    expect(res.text).toBe('profile episodes');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/recommendations', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/shows/789/recommendations');
    expect(res.status).toBe(200);
    expect(res.text).toBe('show recommendations');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/similar', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/shows/789/similar');
    expect(res.status).toBe(200);
    expect(res.text).toBe('similar shows');
  });
});
