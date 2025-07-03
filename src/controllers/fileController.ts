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
    // Handle file upload with proper error catching
    await uploadFileMiddleware(req, res);

    if (!req.file) {
      res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a file!',
        code: 'NO_FILE_PROVIDED',
      });
      return;
    }

    const accountImage = req.file.filename;
    const account = await accountService.findAccountById(accountId);

    if (!account) {
      throw new BadRequestError('Failed to add/update an account image - account not found');
    }

    const updatedAccount = await accountService.updateAccountImage(accountId, accountImage);

    if (!updatedAccount) {
      throw new BadRequestError('Failed to add/update an account image - update failed');
    }

    // Send success response
    res.status(200).json({
      message: `Uploaded the file successfully: ${accountImage}`,
      result: updatedAccount,
    });

    // Clean up old image file (async, don't wait for it)
    if (account.image && account.image !== accountImage) {
      const filePath = getUploadDirectory() + '/accounts/' + account.image;
      fs.unlink(filePath, (err) => {
        if (err) {
          if (err.code === 'ENOENT') {
            appLogger.info('Previous account image file not found when attempting to delete');
          } else {
            appLogger.warn('Error deleting previous account image file', {
              filePath,
              error: err.message,
            });
          }
        } else {
          appLogger.info('Successfully deleted previous account image file', { filePath });
        }
      });
    }
  } catch (error: any) {
    // Handle structured upload errors
    if (error.status && error.code) {
      res.status(error.status).json({
        message: error.message,
        code: error.code,
      });
      return;
    }

    // Handle other errors
    next(error);
  }
});

// POST /api/v1/upload/accounts/:accountId/profiles/:profileId
export const uploadProfileImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { profileId } = req.params as unknown as AccountAndProfileIdsParams;

  try {
    // Handle file upload with proper error catching
    await uploadFileMiddleware(req, res);

    if (!req.file) {
      res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a file!',
        code: 'NO_FILE_PROVIDED',
      });
      return;
    }

    const profileImage = req.file.filename;
    const profile = await profileService.findProfileById(profileId);

    if (!profile) {
      throw new BadRequestError('Failed to add/update a profile image - profile not found');
    }

    const updatedProfile = await profileService.updateProfileImage(profileId, profileImage);

    if (!updatedProfile) {
      throw new BadRequestError('Failed to add/update a profile image - update failed');
    }

    // Send success response
    res.status(200).json({
      message: `Uploaded the file successfully: ${profileImage}`,
      profile: updatedProfile,
    });

    // Invalidate profile cache
    profileService.invalidateProfileCache(profileId);

    // Clean up old image file (async, don't wait for it)
    if (profile.image && profile.image !== profileImage) {
      const filePath = getUploadDirectory() + '/profiles/' + profile.image;
      fs.unlink(filePath, (err) => {
        if (err) {
          if (err.code === 'ENOENT') {
            appLogger.info('Previous profile image file not found when attempting to delete');
          } else {
            appLogger.warn('Error deleting previous profile image file', {
              filePath,
              error: err.message,
            });
          }
        } else {
          appLogger.info('Successfully deleted previous profile image file', { filePath });
        }
      });
    }
  } catch (error: any) {
    // Handle structured upload errors
    if (error.status && error.code) {
      res.status(error.status).json({
        message: error.message,
        code: error.code,
      });
      return;
    }

    // Handle other errors
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
