import {
  AccountAndProfileIdsParams,
  AccountIdParam,
  ProfileNameBody,
} from '@ajgifford/keepwatching-common-server/schema';
import { profileService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

/**
 * Retrieves all profiles for a specific account.
 *
 * @route GET /api/v1/accounts/:accountId/profiles
 */
export const getProfiles = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accountId } = req.params as unknown as AccountIdParam;

    const profiles = await profileService.getProfilesByAccountId(accountId);

    res.status(200).json({
      message: `Retrieved profiles for account ${accountId}`,
      profiles,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Retrieves a specific profile with all its associated content (shows, episodes, movies).
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId
 */
export const getProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;

    const profileWithContent = await profileService.getProfileWithContent(profileId);

    res.status(200).json({
      message: `Retrieved profile with id: ${profileId} and it's content`,
      profileWithContent,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Creates a new profile for an account.
 *
 * @route POST /api/v1/accounts/:accountId/profiles
 */
export const addProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accountId } = req.params as unknown as AccountIdParam;
    const { name }: ProfileNameBody = req.body;

    const profile = await profileService.createProfile(accountId, name);

    res.status(201).json({
      message: 'Profile added successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Updates an existing profile's details.
 *
 * @route PUT /api/v1/accounts/:accountId/profiles/:profileId
 */
export const editProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { name }: ProfileNameBody = req.body;

    const profile = await profileService.updateProfileName(profileId, name);

    res.status(200).json({
      message: 'Profile edited successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Deletes a profile from an account.
 *
 * This action will cascade delete all watch status data for the profile.
 *
 * @route DELETE /api/v1/accounts/:accountId/profiles/:profileId
 */
export const deleteProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;

    await profileService.deleteProfile(profileId);

    res.status(204).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    next(error);
  }
});
