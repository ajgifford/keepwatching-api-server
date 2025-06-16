import uploadFileMiddleware from '../middleware/uploadMiddleware';
import { BadRequestError } from '@ajgifford/keepwatching-common-server';
import { getUploadDirectory } from '@ajgifford/keepwatching-common-server/config';
import { appLogger } from '@ajgifford/keepwatching-common-server/logger';
import { AccountAndProfileIdsParams, AccountIdParam } from '@ajgifford/keepwatching-common-server/schema';
import { accountService, profileService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs';
import path from 'path';

// POST /api/v1/upload/accounts/:accountId
export const uploadAccountImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { accountId } = req.params as unknown as AccountIdParam;
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
          const filePath = path.join(getUploadDirectory(), 'accounts', account.image);
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
});

// POST /api/v1/upload/accounts/:accountId/profiles/:profileId
export const uploadProfileImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
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
            profile: updatedProfile,
          });
          const filePath = path.join(getUploadDirectory(), 'profiles', profile.image!);
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
});

// DELETE /api/v1/upload/accounts/:accountId/image
export const deleteAccountImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { accountId } = req.params as unknown as AccountIdParam;

  try {
    const account = await accountService.findAccountById(accountId);
    if (!account) {
      throw new BadRequestError('Failed to remove an account image');
    }
    const updatedAccount = await accountService.updateAccountImage(accountId, null);
    if (!updatedAccount) {
      throw new BadRequestError('Failed to remove an account image');
    }

    const filePath = path.join(getUploadDirectory(), 'accounts', account.image);
    fs.unlink(filePath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          appLogger.info('Image file not found when attempting to delete', { filePath });
        } else {
          appLogger.error('Error deleting account image file', { error: err, filePath });
        }
      } else {
        appLogger.info('Successfully deleted account image file', { filePath });
      }
    });

    res.status(200).json({
      message: 'Account image deleted successfully',
      result: updatedAccount,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/upload/accounts/:accountId/profiles/:profileId/image
export const deleteProfileImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { profileId } = req.params as unknown as AccountAndProfileIdsParams;

  try {
    const profile = await profileService.findProfileById(profileId);
    if (!profile) {
      throw new BadRequestError('Failed to remove a profile image');
    }
    const updatedProfile = await profileService.updateProfileImage(profileId, null);
    if (!updatedProfile) {
      throw new BadRequestError('Failed to update profile image');
    }

    const filePath = path.join(getUploadDirectory(), 'profiles', profile.image!);
    fs.unlink(filePath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          appLogger.info('Image file not found when attempting to delete', { filePath });
        } else {
          appLogger.error('Error deleting profile image file', { error: err, filePath });
        }
      } else {
        appLogger.info('Successfully deleted profile image file', { filePath });
      }
    });

    profileService.invalidateProfileCache(profileId);

    res.status(200).json({
      message: 'Profile image deleted successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
});
