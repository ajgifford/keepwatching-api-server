import axios from 'axios';
import { NextFunction, Request, Response } from 'express';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RECAPTCHA_SCORE_THRESHOLD = 0.5;

export const verifyCaptcha = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    next();
    return;
  }

  const { recaptchaToken, ...bodyWithoutToken } = req.body;

  if (!recaptchaToken) {
    res.status(400).json({ message: 'reCAPTCHA token is required' });
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', recaptchaToken);

    const { data } = await axios.post<{ success: boolean; score: number }>(RECAPTCHA_VERIFY_URL, params);

    if (!data.success || data.score < RECAPTCHA_SCORE_THRESHOLD) {
      res.status(403).json({ message: 'reCAPTCHA verification failed. Please try again.' });
      return;
    }

    req.body = bodyWithoutToken;
    next();
  } catch {
    res.status(500).json({ message: 'reCAPTCHA verification error' });
  }
};
