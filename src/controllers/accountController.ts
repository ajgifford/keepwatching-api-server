/**
 * Account Controller
 *
 * This module contains controller functions for handling account-related operations
 * including profile management and account editing.
 *
 * @module controllers/accountController
 */
import {
  AccountAndProfileIdsParams,
  AccountIdParam,
  AccountUpdateParams,
  ProfileNameParam,
} from '../schema/accountSchema';
import { accountService } from '../services/accountService';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

/**
 * Retrieves all profiles for a specific account.
 *
 * @route GET /api/v1/accounts/:id/profiles
 * @throws {BadRequestError} If profiles cannot be retrieved
 */
export const getProfiles = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accountId } = req.params as AccountIdParam;

    const profiles = await accountService.getProfiles(Number(accountId));

    res.status(200).json({
      message: `Retrieved profiles for account ${accountId}`,
      results: profiles,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Retrieves a specific profile with all its associated content (shows, episodes, movies).
 *
 * @route GET /api/v1/accounts/:id/profiles/:profileId
 * @throws {NotFoundError} If the requested profile is not found
 */
export const getProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;

    const result = await accountService.getProfile(Number(profileId));

    res.status(200).json({
      message: `Retrieved profile with id: ${profileId}`,
      results: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Updates an account's details (name and default profile).
 *
 * @route PUT /api/v1/accounts/:id
 * @throws {NotFoundError} If the account is not found
 * @throws {BadRequestError} If the account update fails
 */
export const editAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accountId } = req.params as AccountIdParam;
    const { name, defaultProfileId }: AccountUpdateParams = req.body;

    const updatedAccount = await accountService.editAccount(Number(accountId), name, Number(defaultProfileId));

    res.status(200).json({
      message: `Updated account ${accountId}`,
      result: updatedAccount,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Creates a new profile for an account.
 *
 * @route POST /api/v1/accounts/:id/profiles
 * @throws {BadRequestError} If the profile creation fails
 */
export const addProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accountId } = req.params as AccountIdParam;
    const { name }: ProfileNameParam = req.body;

    const newProfile = await accountService.addProfile(Number(accountId), name);

    res.status(201).json({
      message: 'Profile added successfully',
      result: newProfile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Updates an existing profile's details.
 *
 * @route PUT /api/v1/accounts/:id/profiles/:profileId
 * @throws {NotFoundError} If the profile is not found
 * @throws {BadRequestError} If the profile update fails
 */
export const editProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const { name }: ProfileNameParam = req.body;

    const updatedProfile = await accountService.editProfile(Number(profileId), name);

    res.status(200).json({
      message: 'Profile edited successfully',
      result: updatedProfile,
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
 * @route DELETE /api/v1/accounts/:id/profiles/:profileId
 * @throws {NotFoundError} If the profile is not found
 * @throws {BadRequestError} If the profile deletion fails
 */
export const deleteProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accountId, profileId } = req.params as AccountAndProfileIdsParams;

    await accountService.deleteProfile(Number(profileId), Number(accountId));

    res.status(204).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    next(error);
  }
});
