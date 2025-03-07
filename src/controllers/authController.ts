import { httpLogger } from '../logger/logger';
import { AuthenticationError, BadRequestError, ConflictError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import { getAccountImage, getPhotoForGoogleAccount } from '../utils/imageUtility';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';

// POST /api/v1/accounts
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, uid } = req.body;

    const accountExists = await Account.findByEmail(email);
    if (accountExists) {
      throw new ConflictError('An account with this email already exists');
    }

    const account = new Account(name, email, uid);
    await account.register();

    res.status(201).json({
      message: 'Account registered successfully',
      result: {
        id: account.account_id,
        name: account.account_name,
        uid: account.uid,
        email: account.email,
        image: getAccountImage(account),
        default_profile_id: account.default_profile_id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return next(new BadRequestError(errorMessage));
    }

    next(error);
  }
});

// POST /api/v1/login
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uid } = req.body;

    const account = await Account.findByUID(uid);
    if (!account) {
      throw new AuthenticationError('Account not found');
    }

    httpLogger.info(`User logged in: ${account.email}`, { userId: account.uid });

    res.status(201).json({
      message: 'Login successful',
      result: {
        id: account.account_id,
        name: account.account_name,
        uid: account.uid,
        email: account.email,
        image: getAccountImage(account),
        default_profile_id: account.default_profile_id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return next(new BadRequestError(errorMessage));
    }

    next(error);
  }
});

// POST /api/v1/googleLogin
export const googleLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, uid, photoURL } = req.body;

    const account = await Account.findByUID(uid);
    if (account) {
      httpLogger.info(`User logged in via Google: ${account.email}`, { userId: account.uid });

      res.status(201).json({
        message: 'Login successful',
        result: {
          id: account.account_id,
          name: account.account_name,
          uid: account.uid,
          email: account.email,
          image: getPhotoForGoogleAccount(name, photoURL, account),
          default_profile_id: account.default_profile_id,
        },
      });
      return;
    }

    const newAccount = new Account(name, email, uid);
    await newAccount.register();

    httpLogger.info(`New user registered via Google: ${email}`, { userId: uid });

    res.status(201).json({
      message: 'Account registered successfully',
      result: {
        id: newAccount.account_id,
        name: newAccount.account_name,
        uid: newAccount.uid,
        email: newAccount.email,
        image: getPhotoForGoogleAccount(name, photoURL, newAccount),
        default_profile_id: newAccount.default_profile_id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return next(new BadRequestError(errorMessage));
    }

    next(error);
  }
});
