import router from '@routes/communityRecommendationsRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/communityRecommendationsController', () => ({
  getProfileRecommendations: jest.fn((_req, res) => res.status(200).send('profile recommendations')),
  addRecommendation: jest.fn((_req, res) => res.status(201).send('recommendation added')),
  removeRecommendation: jest.fn((_req, res) => res.status(200).send('recommendation removed')),
  getCommunityRecommendations: jest.fn((_req, res) => res.status(200).send('community recommendations')),
  getRecommendationDetails: jest.fn((_req, res) => res.status(200).send('recommendation details')),
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

describe('Community Recommendations Router', () => {
  it('GET /api/v1/community/recommendations', async () => {
    const res = await request(app).get('/api/v1/community/recommendations');
    expect(res.status).toBe(200);
    expect(res.text).toBe('community recommendations');
  });

  it('GET /api/v1/community/recommendations?contentType=show', async () => {
    const res = await request(app).get('/api/v1/community/recommendations?contentType=show');
    expect(res.status).toBe(200);
    expect(res.text).toBe('community recommendations');
  });

  it('GET /api/v1/community/recommendations/:contentType/:contentId', async () => {
    const res = await request(app).get('/api/v1/community/recommendations/show/42');
    expect(res.status).toBe(200);
    expect(res.text).toBe('recommendation details');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/recommendations', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/recommendations');
    expect(res.status).toBe(200);
    expect(res.text).toBe('profile recommendations');
  });

  it('POST /api/v1/accounts/:accountId/profiles/:profileId/recommendations', async () => {
    const res = await request(app).post('/api/v1/accounts/123/profiles/456/recommendations').send({});
    expect(res.status).toBe(201);
    expect(res.text).toBe('recommendation added');
  });

  it('DELETE /api/v1/accounts/:accountId/profiles/:profileId/recommendations', async () => {
    const res = await request(app).delete('/api/v1/accounts/123/profiles/456/recommendations').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('recommendation removed');
  });
});
