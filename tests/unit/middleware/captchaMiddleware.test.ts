import { verifyCaptcha } from '@middleware/captchaMiddleware';
import axios from 'axios';
import { NextFunction, Request, Response } from 'express';

jest.mock('axios');

describe('captchaMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  const originalEnv = process.env;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('when RECAPTCHA_SECRET_KEY is not set', () => {
    it('should skip verification and call next', async () => {
      delete process.env.RECAPTCHA_SECRET_KEY;
      req.body = { uid: 'test-uid', recaptchaToken: 'some-token' };

      await verifyCaptcha(req as Request, res as Response, next);

      expect(axios.post).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should skip even when no token is present in body', async () => {
      delete process.env.RECAPTCHA_SECRET_KEY;
      req.body = { uid: 'test-uid' };

      await verifyCaptcha(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('when RECAPTCHA_SECRET_KEY is set', () => {
    beforeEach(() => {
      process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key';
    });

    it('should return 400 when recaptchaToken is missing from body', async () => {
      req.body = { uid: 'test-uid' };

      await verifyCaptcha(req as Request, res as Response, next);

      expect(axios.post).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'reCAPTCHA token is required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when recaptchaToken is an empty string', async () => {
      req.body = { uid: 'test-uid', recaptchaToken: '' };

      await verifyCaptcha(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'reCAPTCHA token is required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when Google returns success: false', async () => {
      req.body = { uid: 'test-uid', recaptchaToken: 'bad-token' };
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: false, score: 0.3 } });

      await verifyCaptcha(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'reCAPTCHA verification failed. Please try again.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when score is below threshold (0.5)', async () => {
      req.body = { uid: 'test-uid', recaptchaToken: 'low-score-token' };
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true, score: 0.4 } });

      await verifyCaptcha(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'reCAPTCHA verification failed. Please try again.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next and strip token from body when score meets threshold exactly (0.5)', async () => {
      req.body = { uid: 'test-uid', recaptchaToken: 'border-token' };
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true, score: 0.5 } });

      await verifyCaptcha(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ uid: 'test-uid' });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next and strip token from body when verification succeeds', async () => {
      req.body = { uid: 'test-uid', recaptchaToken: 'valid-token' };
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true, score: 0.9 } });

      await verifyCaptcha(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ uid: 'test-uid' });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should send the secret key and token to Google verify URL', async () => {
      req.body = { uid: 'test-uid', recaptchaToken: 'my-token' };
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true, score: 0.9 } });

      await verifyCaptcha(req as Request, res as Response, next);

      const [url, params] = (axios.post as jest.Mock).mock.calls[0];
      expect(url).toBe('https://www.google.com/recaptcha/api/siteverify');
      expect((params as URLSearchParams).get('secret')).toBe('test-secret-key');
      expect((params as URLSearchParams).get('response')).toBe('my-token');
    });

    it('should return 500 when the Google API call throws', async () => {
      req.body = { uid: 'test-uid', recaptchaToken: 'some-token' };
      (axios.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      await verifyCaptcha(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'reCAPTCHA verification error' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should preserve other body fields after stripping the token', async () => {
      req.body = { uid: 'test-uid', email: 'user@example.com', name: 'Test', recaptchaToken: 'valid-token' };
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true, score: 0.9 } });

      await verifyCaptcha(req as Request, res as Response, next);

      expect(req.body).toEqual({ uid: 'test-uid', email: 'user@example.com', name: 'Test' });
      expect(next).toHaveBeenCalled();
    });
  });
});
