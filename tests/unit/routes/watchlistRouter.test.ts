import router from '@routes/watchlistRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/watchlistController', () => ({
  getWatchlist: jest.fn((_req, res) => res.status(200).send('watchlist')),
  addWatchlistItem: jest.fn((_req, res) => res.status(201).send('item added')),
  removeWatchlistItem: jest.fn((_req, res) => res.status(200).send('item removed')),
  updateWatchlistPriorities: jest.fn((_req, res) => res.status(200).send('priorities updated')),
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

jest.mock('@ajgifford/keepwatching-common-server/middleware', () => ({
  logRequestContext: (_req: any, _res: any, next: () => any) => next(),
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Watchlist Router', () => {
  it('GET /api/v1/accounts/:accountId/profiles/:profileId/watchlist', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/watchlist');
    expect(res.status).toBe(200);
    expect(res.text).toBe('watchlist');
  });

  it('POST /api/v1/accounts/:accountId/profiles/:profileId/watchlist', async () => {
    const res = await request(app)
      .post('/api/v1/accounts/123/profiles/456/watchlist')
      .send({ contentType: 'show', contentId: 42 });
    expect(res.status).toBe(201);
    expect(res.text).toBe('item added');
  });

  it('DELETE /api/v1/accounts/:accountId/profiles/:profileId/watchlist/:itemId', async () => {
    const res = await request(app).delete('/api/v1/accounts/123/profiles/456/watchlist/1');
    expect(res.status).toBe(200);
    expect(res.text).toBe('item removed');
  });

  it('PUT /api/v1/accounts/:accountId/profiles/:profileId/watchlist/priorities', async () => {
    const res = await request(app)
      .put('/api/v1/accounts/123/profiles/456/watchlist/priorities')
      .send({ priorities: [{ id: 1, priority: 0 }] });
    expect(res.status).toBe(200);
    expect(res.text).toBe('priorities updated');
  });
});
