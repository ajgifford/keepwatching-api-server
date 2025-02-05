import { AuthenticationError, BadRequestError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import { getAccountImage, getPhotoForGoogleAccount } from '../utils/imageUtility';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { validationResult } from 'express-validator';

// POST /api/v1/accounts
export const register = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { name, email, uid } = req.body;
  const accountExists = await Account.findByEmail(email);

  if (accountExists) {
    res.status(409).json({ message: 'An account with this email already exists' });
  }

  const account = new Account(name, email, uid);
  await account.register();

  if (account) {
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
  } else {
    throw new BadRequestError('An error occured while creating the account');
  }
});

// POST /api/v1/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { uid } = req.body;
  const account = await Account.findByUID(uid);

  if (account) {
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
  } else {
    throw new AuthenticationError('Account not found');
  }
});

// POST /api/v1/googleLogin
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const { name, email, uid, photoURL } = req.body;
  const account = await Account.findByUID(uid);

  if (account) {
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
  if (newAccount) {
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
  } else {
    throw new BadRequestError('An error occured while creating the account');
  }
});
