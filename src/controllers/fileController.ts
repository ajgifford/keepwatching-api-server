import { UPLOADS_DIR } from '..';
import uploadFileMiddleware from '../middleware/uploadMiddleware';
import { AccountAndProfileIdsParams, AccountIdParam } from '../schema/accountSchema';
import { httpLogger } from '@ajgifford/keepwatching-common-server/logger';
import { BadRequestError } from '@ajgifford/keepwatching-common-server/middleware/errorMiddleware';
import { accountService, profileService } from '@ajgifford/keepwatching-common-server/services';
import { getAccountImage, getProfileImage } from '@ajgifford/keepwatching-common-server/utils';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs';

// POST /api/v1/upload/accounts/:accountId
export const uploadAccountImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { accountId } = req.params as AccountIdParam;
  try {
    await uploadFileMiddleware(req, res);

    if (req.file == undefined) {
      res.status(400).send({ message: 'Please upload a file!' });
    } else {
      const accountImage = req.file.filename;
      const account = await accountService.findAccountById(Number(accountId));
      if (account) {
        const updatedAccount = await accountService.updateAccountImage(Number(accountId), accountImage);
        if (updatedAccount) {
          res.status(200).send({
            message: `Uploaded the file successfully: ${accountImage}`,
            result: {
              id: account.id,
              name: account.name,
              email: account.email,
              image: getAccountImage(updatedAccount.image, updatedAccount.name),
              default_profile_id: account.default_profile_id,
            },
          });
          const filePath = UPLOADS_DIR + '/accounts/' + account.image;
          fs.unlink(filePath, (err) => {
            if (err) {
              if (err.code === 'ENOENT') {
                httpLogger.info('File not found when attempting to delete');
              } else {
                httpLogger.info('Unexpected exception when attempting to delete', err);
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
});

// POST /api/v1/upload/accounts/:accountId/profiles/:profileId
export const uploadProfileImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { profileId } = req.params as AccountAndProfileIdsParams;
  try {
    await uploadFileMiddleware(req, res);

    if (req.file == undefined) {
      res.status(400).send({ message: 'Please upload a file!' });
    } else {
      const profileImage = req.file.filename;
      const profile = await profileService.findProfileById(Number(profileId));
      if (profile) {
        const updatedProfile = await profileService.updateProfileImage(Number(profileId), profileImage);
        if (updatedProfile) {
          res.status(200).send({
            message: `Uploaded the file successfully: ${profileImage}`,
            result: {
              id: updatedProfile.id,
              name: updatedProfile.name,
              image: getProfileImage(updatedProfile.image, updatedProfile.name),
            },
          });
          const filePath = UPLOADS_DIR + '/profiles/' + profile.image;
          fs.unlink(filePath, (err) => {
            if (err) {
              if (err.code === 'ENOENT') {
                httpLogger.info('File not found when attempting to delete');
              } else {
                httpLogger.info('Unexpected exception when attempting to delete', err);
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
});
