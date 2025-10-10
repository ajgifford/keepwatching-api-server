import router from '@routes/notificationsRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/notificationsController', () => ({
  getNotifications: jest.fn((_req, res) => res.status(200).send('notifications')),
  markNotificationRead: jest.fn((_req, res) => res.status(200).send('notification marked read')),
  markAllNotificationsRead: jest.fn((_req, res) => res.status(200).send('all notifications marked read')),
  dismissNotification: jest.fn((_req, res) => res.status(200).send('notification dismissed')),
  dismissAllNotifications: jest.fn((_req, res) => res.status(200).send('all notifications dismissed')),
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

describe('Notifications Router', () => {
  it('GET /api/v1/accounts/:accountId/notifications', async () => {
    const res = await request(app).get('/api/v1/accounts/123/notifications');
    expect(res.status).toBe(200);
    expect(res.text).toBe('notifications');
  });

  it('POST /api/v1/accounts/:accountId/notifications/read/:notificationId', async () => {
    const res = await request(app).post('/api/v1/accounts/123/notifications/read/456');
    expect(res.status).toBe(200);
    expect(res.text).toBe('notification marked read');
  });

  it('POST /api/v1/accounts/:accountId/notifications/read', async () => {
    const res = await request(app).post('/api/v1/accounts/123/notifications/read');
    expect(res.status).toBe(200);
    expect(res.text).toBe('all notifications marked read');
  });

  it('POST /api/v1/accounts/:accountId/notifications/dismiss/:notificationId', async () => {
    const res = await request(app).post('/api/v1/accounts/123/notifications/dismiss/456');
    expect(res.status).toBe(200);
    expect(res.text).toBe('notification dismissed');
  });

  it('POST /api/v1/accounts/:accountId/notifications/dismiss', async () => {
    const res = await request(app).post('/api/v1/accounts/123/notifications/dismiss');
    expect(res.status).toBe(200);
    expect(res.text).toBe('all notifications dismissed');
  });
});
