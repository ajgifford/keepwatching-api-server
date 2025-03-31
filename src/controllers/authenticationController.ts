import { AccountIdParam, AccountParams, GoogleLoginParams, LoginParam } from '../schema/accountSchema';
import { authenticationService } from '../services/authenticationService';
import { getAccountImage, getPhotoForGoogleAccount } from '../utils/imageUtility';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

/**
 * Register a new account
 *
 * @route POST /api/v1/authentication/register
 */
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, uid }: AccountParams = req.body;
    const account = await authenticationService.register(name, email, uid);

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

/**
 * Login an account using the provided uid
 *
 * @route POST /api/v1/authentication/login
 */
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uid }: LoginParam = req.body;
    const account = await authenticationService.login(uid);

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

/**
 * Login (or register) an account using Google.
 *
 * @route POST /api/v1/authentication/googleLogin
 */
export const googleLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, uid, photoURL }: GoogleLoginParams = req.body;
    const googleLogin = await authenticationService.googleLogin(name, email, uid);
    res.status(201).json({
      message: googleLogin.message,
      result: {
        id: googleLogin.account.account_id,
        name: googleLogin.account.account_name,
        uid: googleLogin.account.uid,
        email: googleLogin.account.email,
        image: getPhotoForGoogleAccount(name, photoURL, googleLogin.account),
        default_profile_id: googleLogin.account.default_profile_id,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Logout the account with the provided id.
 *
 * @route POST /api/v1/authentication/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId }: AccountIdParam = req.body;
    authenticationService.logout(accountId);
    res.status(200).json({ message: 'Account logged out' });
  } catch (error) {
    next(error);
  }
});
