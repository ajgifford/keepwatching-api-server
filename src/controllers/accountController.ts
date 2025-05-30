import {
  AccountIdParam,
  AccountParams,
  AccountUpdateParams,
  GoogleLoginParams,
  LoginParam,
} from '@ajgifford/keepwatching-common-server/schema';
import { accountService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

/**
 * Register a new account
 *
 * Creates a new user account with the provided details
 *
 * @route POST /api/v1/accounts/register
 * @param {Request} req - Express request containing name, email, and uid in body
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Response} 201 with new account details on success
 */
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, uid }: AccountParams = req.body;
    const account = await accountService.register(name, email, uid);

    res.status(201).json({
      message: 'Account registered successfully',
      result: {
        id: account.id,
        name: account.name,
        uid: account.uid,
        email: account.email,
        image: account.image,
        defaultProfileId: account.defaultProfileId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Login with existing account
 *
 * Authenticates a user with their Firebase UID
 *
 * @route POST /api/v1/accounts/login
 * @param {Request} req - Express request containing uid in body
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Response} 200 with account details on success
 */
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uid }: LoginParam = req.body;
    const account = await accountService.login(uid);

    res.status(200).json({
      message: 'Login successful',
      result: {
        id: account.id,
        name: account.name,
        uid: account.uid,
        email: account.email,
        image: account.image,
        defaultProfileId: account.defaultProfileId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Login or register with Google
 *
 * Authenticates a user with Google credentials, creating a new account if needed
 *
 * @route POST /api/v1/accounts/googleLogin
 * @param {Request} req - Express request containing name, email, uid, and optional photoURL in body
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Response} 201 for new accounts, 200 for existing accounts
 */
export const googleLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, uid, photoURL }: GoogleLoginParams = req.body;
    const googleLoginResult = await accountService.googleLogin(name, email, uid, photoURL);

    const statusCode = googleLoginResult.isNewAccount ? 201 : 200;
    const message = googleLoginResult.isNewAccount ? 'Account registered successfully' : 'Login successful';

    res.status(statusCode).json({
      message: message,
      result: {
        id: googleLoginResult.account.id,
        name: googleLoginResult.account.name,
        uid: googleLoginResult.account.uid,
        email: googleLoginResult.account.email,
        image: googleLoginResult.account.image,
        defaultProfileId: googleLoginResult.account.defaultProfileId,
        isNewAccount: googleLoginResult.isNewAccount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Logout user
 *
 * Logs out the user by invalidating their cache data
 *
 * @route POST /api/v1/accounts/logout
 * @param {Request} req - Express request containing accountId in body
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Response} 200 with success message
 */
export const logout = asyncHandler(async (req: Request<AccountIdParam>, res: Response, next: NextFunction) => {
  try {
    const { accountId }: AccountIdParam = req.body;
    accountService.logout(accountId);
    res.status(200).json({ message: 'Account logged out' });
  } catch (error) {
    next(error);
  }
});

/**
 * Updates an account's details (name and default profile).
 *
 * @route PUT /api/v1/accounts/:accountId
 */
export const editAccount = asyncHandler(
  async (req: Request<AccountIdParam>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId } = req.params as AccountIdParam;
      const { name, defaultProfileId }: AccountUpdateParams = req.body;

      const updatedAccount = await accountService.editAccount(accountId, name, defaultProfileId);

      res.status(200).json({
        message: `Updated account ${accountId}`,
        result: updatedAccount,
      });
    } catch (error) {
      next(error);
    }
  },
);
