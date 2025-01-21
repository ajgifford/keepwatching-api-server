import { AuthenticationError, BadRequestError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import { clearToken, generateToken } from '../utils/auth';
import { getAccountImage } from '../utils/imageUtility';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { validationResult } from 'express-validator';

// POST /api/accounts
export const register = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { name, email, password } = req.body;
  const accountExists = await Account.findByEmail(email);

  if (accountExists) {
    res.status(409).json({ message: 'An account with this email already exists' });
  }

  const account = new Account(name, email, password);
  await account.register();

  if (account) {
    generateToken(res, account.account_id!);
    res.status(201).json({
      message: 'Account registered successfully',
      result: {
        id: account.account_id,
        name: account.account_name,
        email: account.email,
        image: getAccountImage(account),
        default_profile_id: account.default_profile_id,
      },
    });
  } else {
    throw new BadRequestError('An error occured while creating the account');
  }
});

// POST /api/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;
  const account = await Account.findByEmail(email);

  if (account && (await account.comparePassword(password))) {
    generateToken(res, account.account_id!);
    res.status(201).json({
      message: 'Login successful',
      result: {
        id: account.account_id,
        name: account.account_name,
        email: account.email,
        image: getAccountImage(account),
        default_profile_id: account.default_profile_id,
      },
    });
  } else {
    throw new AuthenticationError('Account not found / password incorrect');
  }
});

// POST /api/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  clearToken(res);
  res.status(200).json({ message: 'Successfully logged out' });
});
