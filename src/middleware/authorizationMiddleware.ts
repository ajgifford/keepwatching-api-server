import * as accountsDb from '../db/accountsDb';
import { ForbiddenError, UnauthorizedError } from './errorMiddleware';
import { NextFunction, Request, Response } from 'express';

export const authorizeAccountAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authenticatedUid = req.user?.uid;
    const { accountId, profileId } = req.params;

    if (!authenticatedUid) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    const account = await accountsDb.findAccountById(Number(accountId));

    if (!account || account.uid !== authenticatedUid) {
      next(new ForbiddenError('You do not have permission to access this account'));
      return;
    }

    if (profileId) {
      const profilesAccountId = await accountsDb.findAccountIdByProfileId(profileId);
      if (!profilesAccountId || account.id !== profilesAccountId) {
        next(new ForbiddenError('Access forbidden to this profile, it does not belong to the provided account'));
        return;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
