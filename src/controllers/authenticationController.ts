import { httpLogger } from '../logger/logger';
import { AuthenticationError, ConflictError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import { AccountParams, GoogleLoginParams, LoginParam } from '../schema/accountSchema';
import { showService } from '../services/showService';
import { getAccountImage, getPhotoForGoogleAccount } from '../utils/imageUtility';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

// POST /api/v1/authentication/register
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, uid }: AccountParams = req.body;

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
    next(error);
  }
});

// POST /api/v1/authentication/login
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uid }: LoginParam = req.body;

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
    next(error);
  }
});

// POST /api/v1/authentication/googleLogin
export const googleLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, uid, photoURL }: GoogleLoginParams = req.body;

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
    next(error);
  }
});

// POST /api/v1/authentication/logout
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    showService.invalidateCache();
    res.status(200).json({ message: 'Account logged out' });
  } catch (error) {
    next(error);
  }
});
