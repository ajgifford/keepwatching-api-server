import router from '@routes/watchHistoryRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/watchHistoryController', () => ({
  getBulkMarkedShows: jest.fn((_req, res) => res.status(200).send('bulk marked shows')),
  getWatchHistory: jest.fn((_req, res) => res.status(200).send('watch history')),
  retroactivelyMarkShowAsPrior: jest.fn((_req, res) => res.status(200).send('marked as prior')),
  dismissBulkMarkedShow: jest.fn((_req, res) => res.status(200).send('show dismissed')),
  startShowRewatch: jest.fn((_req, res) => res.status(200).send('show rewatch started')),
  startSeasonRewatch: jest.fn((_req, res) => res.status(200).send('season rewatch started')),
  startMovieRewatch: jest.fn((_req, res) => res.status(200).send('movie rewatch started')),
  recordEpisodeRewatch: jest.fn((_req, res) => res.status(200).send('episode rewatch recorded')),
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

describe('Watch History Router', () => {
  it('GET /api/v1/accounts/:accountId/profiles/:profileId/watchHistory/bulkMarked', async () => {
    const res = await request(app).get('/api/v1/accounts/1/profiles/123/watchHistory/bulkMarked');
    expect(res.status).toBe(200);
    expect(res.text).toBe('bulk marked shows');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/watchHistory', async () => {
    const res = await request(app).get('/api/v1/accounts/1/profiles/123/watchHistory');
    expect(res.status).toBe(200);
    expect(res.text).toBe('watch history');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/watchHistory with query params', async () => {
    const res = await request(app)
      .get('/api/v1/accounts/1/profiles/123/watchHistory')
      .query({ page: 1, pageSize: 20, contentType: 'show', sortOrder: 'desc' });
    expect(res.status).toBe(200);
    expect(res.text).toBe('watch history');
  });

  it('POST /api/v1/accounts/:accountId/profiles/:profileId/watchHistory/markAsPrior', async () => {
    const res = await request(app)
      .post('/api/v1/accounts/1/profiles/123/watchHistory/markAsPrior')
      .send({ showId: 456, seasonIds: [1, 2] });
    expect(res.status).toBe(200);
    expect(res.text).toBe('marked as prior');
  });

  it('POST /api/v1/accounts/:accountId/profiles/:profileId/watchHistory/dismiss', async () => {
    const res = await request(app)
      .post('/api/v1/accounts/1/profiles/123/watchHistory/dismiss')
      .send({ showId: 456 });
    expect(res.status).toBe(200);
    expect(res.text).toBe('show dismissed');
  });

  it('POST /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/rewatch', async () => {
    const res = await request(app).post('/api/v1/accounts/1/profiles/123/shows/456/rewatch');
    expect(res.status).toBe(200);
    expect(res.text).toBe('show rewatch started');
  });

  it('POST /api/v1/accounts/:accountId/profiles/:profileId/seasons/:seasonId/rewatch', async () => {
    const res = await request(app).post('/api/v1/accounts/1/profiles/123/seasons/789/rewatch');
    expect(res.status).toBe(200);
    expect(res.text).toBe('season rewatch started');
  });

  it('POST /api/v1/accounts/:accountId/profiles/:profileId/movies/:movieId/rewatch', async () => {
    const res = await request(app).post('/api/v1/accounts/1/profiles/123/movies/321/rewatch');
    expect(res.status).toBe(200);
    expect(res.text).toBe('movie rewatch started');
  });

  it('POST /api/v1/accounts/:accountId/profiles/:profileId/episodes/:episodeId/rewatch', async () => {
    const res = await request(app).post('/api/v1/accounts/1/profiles/123/episodes/654/rewatch');
    expect(res.status).toBe(200);
    expect(res.text).toBe('episode rewatch recorded');
  });
});
