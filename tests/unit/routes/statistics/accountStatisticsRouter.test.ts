import router from '@routes/statisticsRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/accountStatisticsController', () => ({
  getAccountStatistics: jest.fn((_req, res) => res.status(200).send('account statistics')),
  getAccountWatchingVelocity: jest.fn((_req, res) => res.status(200).send('watch velocity statistics')),
  getAccountActivityTimeline: jest.fn((_req, res) => res.status(200).send('activity timeline statistics')),
  getAccountBingeWatchingStats: jest.fn((_req, res) => res.status(200).send('binge watching statistics')),
  getAccountWatchStreakStats: jest.fn((_req, res) => res.status(200).send('watch streak statistics')),
  getAccountTimeToWatchStats: jest.fn((_req, res) => res.status(200).send('time to watch statistics')),
  getAccountSeasonalViewingStats: jest.fn((_req, res) => res.status(200).send('seasonal viewing statistics')),
  getAccountMilestoneStats: jest.fn((_req, res) => res.status(200).send('milestone statistics')),
  getAccountContentDepthStats: jest.fn((_req, res) => res.status(200).send('content depth statistics')),
  getAccountContentDiscoveryStats: jest.fn((_req, res) => res.status(200).send('content discovery statistics')),
  getAccountAbandonmentRiskStats: jest.fn((_req, res) => res.status(200).send('abandonment risk statistics')),
  getAccountUnairedContentStats: jest.fn((_req, res) => res.status(200).send('unaired content statistics')),
  getProfileComparison: jest.fn((_req, res) => res.status(200).send('profile comparison statistics')),
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

describe('Account Statistics Router', () => {
  it('GET /api/v1/accounts/:accountId/statistics', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics');
    expect(res.status).toBe(200);
    expect(res.text).toBe('account statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/velocity', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/velocity');
    expect(res.status).toBe(200);
    expect(res.text).toBe('watch velocity statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/activity/timeline', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/activity/timeline');
    expect(res.status).toBe(200);
    expect(res.text).toBe('activity timeline statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/binge', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/binge');
    expect(res.status).toBe(200);
    expect(res.text).toBe('binge watching statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/streaks', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/streaks');
    expect(res.status).toBe(200);
    expect(res.text).toBe('watch streak statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/time-to-watch', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/time-to-watch');
    expect(res.status).toBe(200);
    expect(res.text).toBe('time to watch statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/seasonal', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/seasonal');
    expect(res.status).toBe(200);
    expect(res.text).toBe('seasonal viewing statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/milestones', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/milestones');
    expect(res.status).toBe(200);
    expect(res.text).toBe('milestone statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/content-depth', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/content-depth');
    expect(res.status).toBe(200);
    expect(res.text).toBe('content depth statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/content-discovery', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/content-discovery');
    expect(res.status).toBe(200);
    expect(res.text).toBe('content discovery statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/abandonment-risk', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/abandonment-risk');
    expect(res.status).toBe(200);
    expect(res.text).toBe('abandonment risk statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/unaired-content', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/unaired-content');
    expect(res.status).toBe(200);
    expect(res.text).toBe('unaired content statistics');
  });

  it('GET /api/v1/accounts/:accountId/statistics/profile-comparison', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics/profile-comparison');
    expect(res.status).toBe(200);
    expect(res.text).toBe('profile comparison statistics');
  });
});
