import router from '@routes/discoverRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/discoverController', () => ({
  discoverTopContent: jest.fn((_req, res) => res.status(200).send('top content')),
  discoverChangesContent: jest.fn((_req, res) => res.status(200).send('changes content')),
  discoverTrendingContent: jest.fn((_req, res) => res.status(200).send('trending content')),
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

describe('Discover Router', () => {
  it('GET /api/v1/discover/top', async () => {
    const res = await request(app).get('/api/v1/discover/top');
    expect(res.status).toBe(200);
    expect(res.text).toBe('top content');
  });

  it('GET /api/v1/discover/changes', async () => {
    const res = await request(app).get('/api/v1/discover/changes');
    expect(res.status).toBe(200);
    expect(res.text).toBe('changes content');
  });

  it('GET /api/v1/discover/trending', async () => {
    const res = await request(app).get('/api/v1/discover/trending');
    expect(res.status).toBe(200);
    expect(res.text).toBe('trending content');
  });
});
