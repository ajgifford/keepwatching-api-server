import { UPLOADS_DIR } from '..';
import * as accountsDb from '../db/accountsDb';
import * as profilesDb from '../db/profilesDb';
import { httpLogger } from '../logger/logger';
import { BadRequestError } from '../middleware/errorMiddleware';
import uploadFileMiddleware from '../middleware/uploadMiddleware';
import { AccountAndProfileIdsParams, AccountIdParam } from '../schema/accountSchema';
import { CacheService } from '../services/cacheService';
import { getAccountImage, getProfileImage } from '../utils/imageUtility';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs';

// POST /api/v1/upload/accounts/:accountId
export const uploadAccountImage = asyncHandler(async (req: Request, res: Response) => {
  const { accountId } = req.params as AccountIdParam;
  try {
    await uploadFileMiddleware(req, res);

    if (req.file == undefined) {
      res.status(400).send({ message: 'Please upload a file!' });
    } else {
      const accountImage = req.file.filename;
      const account = await accountsDb.findAccountById(Number(accountId));
      if (account) {
        const updatedAccount = await accountsDb.updateAccountImage(Number(accountId), accountImage);
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
  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${req.file?.originalname}. ${err}`,
    });
  }
});

// POST /api/v1/upload/accounts/:accountId/profiles/:profileId
export const uploadProfileImage = asyncHandler(async (req: Request, res: Response) => {
  const { profileId } = req.params as AccountAndProfileIdsParams;
  try {
    await uploadFileMiddleware(req, res);

    if (req.file == undefined) {
      res.status(400).send({ message: 'Please upload a file!' });
    } else {
      const profileImage = req.file.filename;
      const profile = await profilesDb.findProfileById(Number(profileId));
      if (profile) {
        const updatedProfile = await profilesDb.updateProfileImage(profile, profileImage);
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

          const cache = CacheService.getInstance();
          cache.invalidateProfile(profileId);
        } else {
          throw new BadRequestError('Failed to add/update a profile image');
        }
      } else {
        throw new BadRequestError('Failed to add/update a profile image');
      }
    }
  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${req.file?.originalname}. ${err}`,
    });
  }
});
