import router from '@routes/preferencesRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/preferencesController', () => ({
  getAccountPreferences: jest.fn((_req, res) => res.status(200).send('account preferences')),
  getAccountPreferencesByType: jest.fn((_req, res) => res.status(200).send('preferences by type')),
  updatePreferences: jest.fn((_req, res) => res.status(200).send('preferences updated')),
  updateMultiplePreferences: jest.fn((_req, res) => res.status(200).send('multiple preferences updated')),
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

describe('Preferences Router', () => {
  it('GET /api/v1/accounts/:accountId/preferences', async () => {
    const res = await request(app).get('/api/v1/accounts/123/preferences');
    expect(res.status).toBe(200);
    expect(res.text).toBe('account preferences');
  });

  it('GET /api/v1/accounts/:accountId/preferences/:preferenceType', async () => {
    const res = await request(app).get('/api/v1/accounts/123/preferences/notifications');
    expect(res.status).toBe(200);
    expect(res.text).toBe('preferences by type');
  });

  it('PUT /api/v1/accounts/:accountId/preferences/:preferenceType', async () => {
    const res = await request(app).put('/api/v1/accounts/123/preferences/notifications').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('preferences updated');
  });

  it('PUT /api/v1/accounts/:accountId/preferences', async () => {
    const res = await request(app).put('/api/v1/accounts/123/preferences').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('multiple preferences updated');
  });
});
