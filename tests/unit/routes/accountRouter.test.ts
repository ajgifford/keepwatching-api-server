import router from '@routes/accountRouter';
import express from 'express';
import request from 'supertest';

jest.mock('@controllers/accountController', () => ({
  register: jest.fn((_req, res) => res.status(201).send('registered')),
  login: jest.fn((_req, res) => res.status(200).send('logged in')),
  googleLogin: jest.fn((_req, res) => res.status(200).send('google logged in')),
  logout: jest.fn((_req, res) => res.status(200).send('logged out')),
  editAccount: jest.fn((_req, res) => res.status(200).send('account edited')),
}));

jest.mock('@middleware/accountActivityMiddleware', () => ({
  trackAccountActivity: (_req: any, _res: any, next: () => any) => next(),
}));

jest.mock('@middleware/authenticationMiddleware', () => ({
  authenticateUser: (_req: any, _res: any, next: () => any) => next(),
}));

jest.mock('@middleware/authorizationMiddleware', () => ({
  authorizeAccountAccess: (_req: any, _res: any, next: () => any) => next(),
}));

jest.mock('@ajgifford/keepwatching-common-server', () => ({
  validateSchema: (_schema: any, _location: any) => (_req: any, _res: any, next: () => any) => next(),
  validateRequest: (_schema: any) => (_req: any, _res: any, next: () => any) => next(),
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Account Router', () => {
  it('POST /api/v1/accounts/register', async () => {
    const res = await request(app).post('/api/v1/accounts/register').send({});
    expect(res.status).toBe(201);
    expect(res.text).toBe('registered');
  });

  it('POST /api/v1/accounts/login', async () => {
    const res = await request(app).post('/api/v1/accounts/login').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('logged in');
  });

  it('POST /api/v1/accounts/googleLogin', async () => {
    const res = await request(app).post('/api/v1/accounts/googleLogin').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('google logged in');
  });

  it('POST /api/v1/accounts/logout', async () => {
    const res = await request(app).post('/api/v1/accounts/logout');
    expect(res.status).toBe(200);
    expect(res.text).toBe('logged out');
  });

  it('PUT /api/v1/accounts/:accountId', async () => {
    const res = await request(app).put('/api/v1/accounts/123').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('account edited');
  });
});
