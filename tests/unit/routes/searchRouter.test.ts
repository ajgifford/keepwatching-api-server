import router from '@routes/searchRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/searchController', () => ({
  searchShows: jest.fn((_req, res) => res.status(200).send('shows search results')),
  searchMovies: jest.fn((_req, res) => res.status(200).send('movies search results')),
  searchPeople: jest.fn((_req, res) => res.status(200).send('people search results')),
}));

jest.mock('@middleware/accountActivityMiddleware', () => ({
  trackAccountActivity: (_req: any, _res: any, next: () => any) => next(),
}));

jest.mock('@ajgifford/keepwatching-common-server', () => ({
  validateSchema: () => (_req: any, _res: any, next: () => any) => next(),
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Search Router', () => {
  it('GET /api/v1/search/shows', async () => {
    const res = await request(app).get('/api/v1/search/shows');
    expect(res.status).toBe(200);
    expect(res.text).toBe('shows search results');
  });

  it('GET /api/v1/search/movies', async () => {
    const res = await request(app).get('/api/v1/search/movies');
    expect(res.status).toBe(200);
    expect(res.text).toBe('movies search results');
  });

  it('GET /api/v1/search/people', async () => {
    const res = await request(app).get('/api/v1/search/people');
    expect(res.status).toBe(200);
    expect(res.text).toBe('people search results');
  });
});
