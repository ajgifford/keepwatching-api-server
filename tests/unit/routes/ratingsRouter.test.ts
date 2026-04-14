import router from '@routes/ratingsRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/ratingsController', () => ({
  getRatingsForProfile: jest.fn((_req, res) => res.status(200).send('ratings')),
  upsertRating: jest.fn((_req, res) => res.status(200).send('rating upserted')),
  deleteRating: jest.fn((_req, res) => res.status(200).send('rating deleted')),
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

describe('Ratings Router', () => {
  it('GET /api/v1/accounts/:accountId/profiles/:profileId/ratings', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/ratings');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ratings');
  });

  it('POST /api/v1/accounts/:accountId/profiles/:profileId/ratings', async () => {
    const res = await request(app).post('/api/v1/accounts/123/profiles/456/ratings').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('rating upserted');
  });

  it('DELETE /api/v1/accounts/:accountId/profiles/:profileId/ratings/:ratingId', async () => {
    const res = await request(app).delete('/api/v1/accounts/123/profiles/456/ratings/789');
    expect(res.status).toBe(200);
    expect(res.text).toBe('rating deleted');
  });
});
