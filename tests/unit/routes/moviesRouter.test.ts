import router from '@routes/moviesRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/moviesController', () => ({
  getMovies: jest.fn((_req, res) => res.status(200).send('movies')),
  addFavorite: jest.fn((_req, res) => res.status(201).send('favorite added')),
  removeFavorite: jest.fn((_req, res) => res.status(200).send('favorite removed')),
  updateMovieWatchStatus: jest.fn((_req, res) => res.status(200).send('movie watch status updated')),
  getRecentUpcomingForProfile: jest.fn((_req, res) => res.status(200).send('recent upcoming movies')),
  getMovieDetails: jest.fn((_req, res) => res.status(200).send('movie details')),
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

describe('Movies Router', () => {
  it('GET /api/v1/accounts/:accountId/profiles/:profileId/movies', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/movies');
    expect(res.status).toBe(200);
    expect(res.text).toBe('movies');
  });

  it('POST /api/v1/accounts/:accountId/profiles/:profileId/movies/favorites', async () => {
    const res = await request(app).post('/api/v1/accounts/123/profiles/456/movies/favorites').send({});
    expect(res.status).toBe(201);
    expect(res.text).toBe('favorite added');
  });

  it('DELETE /api/v1/accounts/:accountId/profiles/:profileId/movies/favorites/:movieId', async () => {
    const res = await request(app).delete('/api/v1/accounts/123/profiles/456/movies/favorites/789');
    expect(res.status).toBe(200);
    expect(res.text).toBe('favorite removed');
  });

  it('PUT /api/v1/accounts/:accountId/profiles/:profileId/movies/watchstatus', async () => {
    const res = await request(app).put('/api/v1/accounts/123/profiles/456/movies/watchstatus').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('movie watch status updated');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/movies/recentUpcoming', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/movies/recentUpcoming');
    expect(res.status).toBe(200);
    expect(res.text).toBe('recent upcoming movies');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/movies/:movieId/details', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/movies/789/details');
    expect(res.status).toBe(200);
    expect(res.text).toBe('movie details');
  });
});
