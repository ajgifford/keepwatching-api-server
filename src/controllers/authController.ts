import { AuthenticationError, BadRequestError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import { clearToken, generateToken } from '../utils/auth';
import { buildAccountImagePath } from '../utils/imageUtility';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  console.log('POST /api/accounts');
  const { name, email, password } = req.body;
  const accountExists = await Account.findByEmail(email);

  if (accountExists) {
    res.status(409).json({ message: 'An account with this email already exists' });
  }

  const account = new Account(name, email, password);
  await account.save();

  if (account) {
    generateToken(res, account.id!);
    res.status(201).json({
      message: 'Account registered successfully',
      result: {
        id: account.id,
        name: account.account_name,
        email: account.email,
        image: buildAccountImagePath(account.account_name),
      },
    });
  } else {
    throw new BadRequestError('An error occured while creating the account');
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  console.log(`POST /api/login`);
  const { email, password } = req.body;
  const account = await Account.findByEmail(email);

  if (account && (await account.comparePassword(password))) {
    generateToken(res, account.id!);
    res.status(201).json({
      message: 'Login successful',
      result: {
        id: account.id,
        name: account.account_name,
        email: account.email,
        image: buildAccountImagePath(account.account_name),
      },
    });
  } else {
    throw new AuthenticationError('Account not found / password incorrect');
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  console.log(`POST /api/logout`);
  clearToken(res);
  res.status(200).json({ message: 'Successfully logged out' });
});
