import Account from '../models/account';
import { AuthenticationError } from './errorMiddleware';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import jwt, { JwtPayload } from 'jsonwebtoken';

const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  console.log('Middleware auth', req.cookies);
  try {
    let token = req.cookies.jwt;

    if (!token) {
      throw new AuthenticationError('Token not found');
    }

    const jwtSecret = process.env.JWT_SECRET || '';
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded || !decoded.accountId) {
      throw new AuthenticationError('AccountId not found');
    }

    const account = await Account.findById(decoded.accountId);

    if (!account) {
      throw new AuthenticationError('Account not found');
    }

    req.account = { id: account.id!, name: account.account_name, email: account.email };
    next();
  } catch (e) {
    console.log(e);
    res.status(401);
    throw new AuthenticationError('Invalid token');
  }
});

export { authenticate };
