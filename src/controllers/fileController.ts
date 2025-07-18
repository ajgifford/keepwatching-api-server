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

/**
 * Upload and update an account's image
 *
 * Handles multipart file upload for account images with comprehensive validation,
 * automatic file processing, and cleanup of previous images. Supports multiple image formats
 * with size restrictions and provides detailed error handling for various failure scenarios.
 * The uploaded image is automatically renamed using a standardized naming convention and
 * stored in the designated uploads directory.
 *
 * @route POST /api/v1/upload/accounts/:accountId
 * @param {Request} req - Express request containing accountId in params and multipart file data
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @param {number} req.params.accountId - Unique identifier of the account to update
 * @param {Express.Multer.File} req.file - Uploaded image file (field name: 'file')
 * @returns {Response} 200 with success message and updated account data
 * @throws {BadRequestError} When no file is provided
 * @throws {BadRequestError} When account is not found or update fails
 * @throws {MulterError} When file validation fails (size, type, etc.)
 * @throws {Error} When file system operations fail
 *
 * @fileRequirements
 * - **Supported formats**: JPEG, PNG, GIF, WebP
 * - **Maximum size**: 5MB (5,242,880 bytes)
 * - **Field name**: 'file' (multipart form data)
 * - **Content-Type**: multipart/form-data
 *
 * @fileNaming
 * - **Pattern**: account-{accountId}.{extension}
 * - **Directory**: uploads/accounts/
 * - **Extension**: Automatically determined from MIME type
 *
 * @sideEffects
 * - Previous account image file is automatically deleted from file system
 * - Account record is updated with new image filename
 * - File deletion errors are logged but don't affect upload success
 *
 * @example
 * // POST /api/v1/upload/accounts/123
 * // Content-Type: multipart/form-data
 * // Authorization: Bearer <token>
 * //
 * // Form data:
 * // file: [binary image data] (profile.jpg)
 * //
 * // Success Response (200):
 * {
 *   "message": "Uploaded the file successfully: account-123.jpg",
 *   "result": {
 *     "id": 123,
 *     "name": "John Doe",
 *     "email": "john.doe@example.com",
 *     "image": "account-123.jpg",
 *     "defaultProfileId": 456
 *   }
 * }
 *
 * @example
 * // Error Response - No file provided (400):
 * {
 *   "error": "No file provided",
 *   "message": "Please upload a file!",
 *   "code": "NO_FILE_PROVIDED"
 * }
 *
 * @example
 * // Error Response - File too large (413):
 * {
 *   "message": "File too large. Maximum file size is 5MB.",
 *   "code": "FILE_TOO_LARGE"
 * }
 *
 * @example
 * // Error Response - Invalid file type (400):
 * {
 *   "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
 *   "code": "INVALID_FILE_TYPE"
 * }
 */
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
      const filePath = path.join(getUploadDirectory(), 'accounts', account.image);
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

/**
 * Upload and update a profile's image
 *
 * Handles multipart file upload for profile images with comprehensive validation,
 * automatic file processing, cache invalidation, and cleanup of previous images.
 * Supports multiple image formats with size restrictions and provides detailed error
 * handling for various failure scenarios. The uploaded image is automatically renamed
 * using a standardized naming convention and the profile cache is invalidated to
 * ensure immediate UI updates.
 *
 * @route POST /api/v1/upload/accounts/:accountId/profiles/:profileId
 * @param {Request} req - Express request containing accountId, profileId in params and multipart file data
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @param {number} req.params.accountId - Unique identifier of the account
 * @param {number} req.params.profileId - Unique identifier of the profile to update
 * @param {Express.Multer.File} req.file - Uploaded image file (field name: 'file')
 * @returns {Response} 200 with success message and updated profile data
 * @throws {BadRequestError} When no file is provided
 * @throws {BadRequestError} When profile is not found or update fails
 * @throws {MulterError} When file validation fails (size, type, etc.)
 * @throws {Error} When file system operations fail
 *
 * @fileRequirements
 * - **Supported formats**: JPEG, PNG, GIF, WebP
 * - **Maximum size**: 5MB (5,242,880 bytes)
 * - **Field name**: 'file' (multipart form data)
 * - **Content-Type**: multipart/form-data
 *
 * @fileNaming
 * - **Pattern**: profile-{profileId}.{extension}
 * - **Directory**: uploads/profiles/
 * - **Extension**: Automatically determined from MIME type
 *
 * @sideEffects
 * - Previous profile image file is automatically deleted from file system
 * - Profile record is updated with new image filename
 * - Profile cache is invalidated for immediate UI updates
 * - File deletion errors are logged but don't affect upload success
 *
 * @authorization
 * - User must own the account containing the profile
 * - Profile must belong to the specified account
 * - Valid authentication token required
 *
 * @example
 * // POST /api/v1/upload/accounts/123/profiles/456
 * // Content-Type: multipart/form-data
 * // Authorization: Bearer <token>
 * //
 * // Form data:
 * // file: [binary image data] (avatar.png)
 * //
 * // Success Response (200):
 * {
 *   "message": "Uploaded the file successfully: profile-456.png",
 *   "profile": {
 *     "id": 456,
 *     "name": "Family Profile",
 *     "image": "profile-456.png"
 *   }
 * }
 *
 * @example
 * // Error Response - Profile not found (400):
 * {
 *   "error": "Failed to add/update a profile image - profile not found"
 * }
 *
 * @example
 * // cURL example:
 * curl -X POST \
 *   -H "Authorization: Bearer your_token_here" \
 *   -F "file=@/path/to/image.jpg" \
 *   https://api.example.com/api/v1/upload/accounts/123/profiles/456
 *
 * @example
 * // JavaScript FormData example:
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 *
 * fetch('/api/v1/upload/accounts/123/profiles/456', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': 'Bearer ' + token
 *   },
 *   body: formData
 * });
 */
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
      const filePath = path.join(getUploadDirectory(), 'profiles', profile.image);
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

/**
 * Delete an account's image
 *
 * Removes the account's current image from both the database record
 * and the file system. Sets the account's image field to null and attempts
 * to delete the physical image file from the uploads directory.
 *
 * @route DELETE /api/v1/upload/accounts/:accountId/image
 * @param {Request} req - Express request containing accountId in params
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Response} 200 with updated account data on success
 * @throws {BadRequestError} When account is not found or update fails
 * @example
 * // DELETE /api/v1/upload/accounts/123/image
 * // Response:
 * {
 *   "message": "Account image deleted successfully",
 *   "result": {
 *     "id": 123,
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "image": null,
 *     "defaultProfileId": 456
 *   }
 * }
 */
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

/**
 * Delete a profile's image
 *
 * Removes the profile's current image from both the database record and the
 * file system. Sets the profile's image field to null, invalidates the profile
 * cache, and attempts to delete the physical image file from the uploads directory.
 *
 * @route DELETE /api/v1/upload/accounts/:accountId/profiles/:profileId/image
 * @param {Request} req - Express request containing accountId and profileId in params
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Response} 200 with updated profile data on success
 * @throws {BadRequestError} When profile is not found or update fails
 * @example
 * // DELETE /api/v1/upload/accounts/123/profiles/456/image
 * // Response:
 * {
 *   "message": "Profile image deleted successfully",
 *   "profile": {
 *     "id": 456,
 *     "name": "Family Profile",
 *     "image": null
 *   }
 * }
 */
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
