import router from '@routes/calendarRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/calendarController', () => ({
  getCalendarContent: jest.fn((_req, res) => res.status(200).send('calendar content')),
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

jest.mock('@ajgifford/keepwatching-common-server/middleware', () => ({
  logRequestContext: (_req: any, _res: any, next: () => any) => next(),
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Calendar Router', () => {
  it('GET /api/v1/accounts/:accountId/profiles/:profileId/calendar', async () => {
    const res = await request(app).get('/api/v1/accounts/123/profiles/456/calendar');
    expect(res.status).toBe(200);
    expect(res.text).toBe('calendar content');
  });

  it('GET /api/v1/accounts/:accountId/profiles/:profileId/calendar with date query params', async () => {
    const res = await request(app)
      .get('/api/v1/accounts/123/profiles/456/calendar')
      .query({ startDate: '2025-03-01', endDate: '2025-03-31' });
    expect(res.status).toBe(200);
    expect(res.text).toBe('calendar content');
  });
});
