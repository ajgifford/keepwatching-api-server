import router from '@routes/statisticsRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/statisticsController', () => ({
  getAccountStatistics: jest.fn((_req, res) => res.status(200).send('account statistics')),
  getProfileStatistics: jest.fn((_req, res) => res.status(200).send('profile statistics')),
  getWatchingVelocity: jest.fn((_req, res) => res.status(200).send('watch velocity statistics')),
  getDailyActivity: jest.fn((_req, res) => res.status(200).send('daily activity statistics')),
  getWeeklyActivity: jest.fn((_req, res) => res.status(200).send('weekly activity statistics')),
  getMonthlyActivity: jest.fn((_req, res) => res.status(200).send('monthly activity statistics')),
  getActivityTimeline: jest.fn((_req, res) => res.status(200).send('activity timeline statistics')),
  getBingeWatchingStats: jest.fn((_req, res) => res.status(200).send('binge watching statistics')),
  getWatchStreakStats: jest.fn((_req, res) => res.status(200).send('watch streak statistics')),
  getTimeToWatchStats: jest.fn((_req, res) => res.status(200).send('time to watch statistics')),
  getSeasonalViewingStats: jest.fn((_req, res) => res.status(200).send('seasonal viewing statistics')),
  getMilestoneStats: jest.fn((_req, res) => res.status(200).send('milestone statistics')),
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

describe('Statistics Router', () => {
  it('GET /api/v1/accounts/:accountId/statistics', async () => {
    const res = await request(app).get('/api/v1/accounts/123/statistics');
    expect(res.status).toBe(200);
    expect(res.text).toBe('account statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics');
    expect(res.status).toBe(200);
    expect(res.text).toBe('profile statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/velocity', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics/velocity');
    expect(res.status).toBe(200);
    expect(res.text).toBe('watch velocity statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/daily', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics/activity/daily');
    expect(res.status).toBe(200);
    expect(res.text).toBe('daily activity statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/weekly', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics/activity/weekly');
    expect(res.status).toBe(200);
    expect(res.text).toBe('weekly activity statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/monthly', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics/activity/monthly');
    expect(res.status).toBe(200);
    expect(res.text).toBe('monthly activity statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/activity/timeline', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics/activity/timeline');
    expect(res.status).toBe(200);
    expect(res.text).toBe('activity timeline statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/binge', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics/binge');
    expect(res.status).toBe(200);
    expect(res.text).toBe('binge watching statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/streaks', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics/streaks');
    expect(res.status).toBe(200);
    expect(res.text).toBe('watch streak statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/time-to-watch', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics/time-to-watch');
    expect(res.status).toBe(200);
    expect(res.text).toBe('time to watch statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/seasonal', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics/seasonal');
    expect(res.status).toBe(200);
    expect(res.text).toBe('seasonal viewing statistics');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/statistics/milestones', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/statistics/milestones');
    expect(res.status).toBe(200);
    expect(res.text).toBe('milestone statistics');
  });
});
