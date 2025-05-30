import uploadFileMiddleware from '../middleware/uploadMiddleware';
import { BadRequestError } from '@ajgifford/keepwatching-common-server';
import { getUploadDirectory } from '@ajgifford/keepwatching-common-server/config';
import { appLogger } from '@ajgifford/keepwatching-common-server/logger';
import { AccountAndProfileIdsParams, AccountIdParam } from '@ajgifford/keepwatching-common-server/schema';
import { accountService, profileService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs';

// POST /api/v1/upload/accounts/:accountId
export const uploadAccountImage = asyncHandler(
  async (req: Request<AccountIdParam>, res: Response, next: NextFunction) => {
    const { accountId } = req.params as AccountIdParam;
    try {
      await uploadFileMiddleware(req, res);

      if (req.file == undefined) {
        res.status(400).send({ message: 'Please upload a file!' });
      } else {
        const accountImage = req.file.filename;
        const account = await accountService.findAccountById(accountId);
        if (account) {
          const updatedAccount = await accountService.updateAccountImage(accountId, accountImage);
          if (updatedAccount) {
            res.status(200).send({
              message: `Uploaded the file successfully: ${accountImage}`,
              result: updatedAccount,
            });
            const filePath = getUploadDirectory() + '/accounts/' + account.image;
            fs.unlink(filePath, (err) => {
              if (err) {
                if (err.code === 'ENOENT') {
                  appLogger.info('File not found when attempting to delete');
                } else {
                  appLogger.info('Unexpected exception when attempting to delete', err);
                }
              }
            });
          } else {
            throw new BadRequestError('Failed to add/update an account image');
          }
        } else {
          throw new BadRequestError('Failed to add/update an account image');
        }
      }
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/upload/accounts/:accountId/profiles/:profileId
export const uploadProfileImage = asyncHandler(
  async (req: Request<AccountIdParam>, res: Response, next: NextFunction) => {
    const { profileId } = req.params as AccountAndProfileIdsParams;
    try {
      await uploadFileMiddleware(req, res);

      if (req.file == undefined) {
        res.status(400).send({ message: 'Please upload a file!' });
      } else {
        const profileImage = req.file.filename;
        const profile = await profileService.findProfileById(profileId);
        if (profile) {
          const updatedProfile = await profileService.updateProfileImage(profileId, profileImage);
          if (updatedProfile) {
            res.status(200).send({
              message: `Uploaded the file successfully: ${profileImage}`,
              result: updatedProfile,
            });
            const filePath = getUploadDirectory() + '/profiles/' + profile.image;
            fs.unlink(filePath, (err) => {
              if (err) {
                if (err.code === 'ENOENT') {
                  appLogger.info('File not found when attempting to delete');
                } else {
                  appLogger.info('Unexpected exception when attempting to delete', err);
                }
              }
            });

            profileService.invalidateProfileCache(profileId);
          } else {
            throw new BadRequestError('Failed to add/update a profile image');
          }
        } else {
          throw new BadRequestError('Failed to add/update a profile image');
        }
      }
    } catch (error) {
      next(error);
    }
  },
);
