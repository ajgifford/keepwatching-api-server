/**
 * Account Controller
 *
 * This module contains controller functions for handling account-related operations
 * including profile management and account editing.
 *
 * @module controllers/accountController
 */
import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import Episode from '../models/episode';
import Movie from '../models/movie';
import Profile from '../models/profile';
import Show from '../models/show';
import {
  AccountAndProfileIdsParams,
  AccountIdParam,
  AccountUpdateParams,
  ProfileNameParam,
} from '../schema/accountSchema';
import { getAccountImage, getProfileImage } from '../utils/imageUtility';
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

    const profiles = await Profile.getAllByAccountId(Number(accountId));
    if (profiles) {
      const responseProfiles = profiles.map((profile) => {
        return { id: profile.id, name: profile.name, image: getProfileImage(profile) };
      });
      res.status(200).json({ message: `Retrieved profiles for account ${accountId}`, results: responseProfiles });
    } else {
      throw new BadRequestError('Failed to get all profiles for an account');
    }
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

    const profile = await Profile.findById(Number(profileId));
    if (profile) {
      const shows = await Show.getAllShowsForProfile(profileId);
      const upcomingEpisodes = await Episode.getUpcomingEpisodesForProfile(profileId);
      const recentEpisodes = await Episode.getRecentEpisodesForProfile(profileId);
      const nextUnwatchedEpisodes = await Show.getNextUnwatchedEpisodesForProfile(profileId);
      const movies = await Movie.getAllMoviesForProfile(profileId);
      const recentMovies = await Movie.getRecentMovieReleasesForProfile(profileId);
      const upcomingMovies = await Movie.getUpcomingMovieReleasesForProfile(profileId);

      res.status(200).json({
        message: `Retrieved profile with id: ${profileId}`,
        results: {
          profile: { id: profile.id, name: profile.name, image: getProfileImage(profile) },
          shows: shows,
          recentEpisodes: recentEpisodes,
          upcomingEpisodes: upcomingEpisodes,
          nextUnwatchedEpisodes: nextUnwatchedEpisodes,
          movies: movies,
          recentMovies: recentMovies,
          upcomingMovies: upcomingMovies,
        },
      });
    } else {
      throw new NotFoundError('Profile not found');
    }
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

    const account = await Account.findById(Number(accountId));
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const updatedAccount = await account.editAccount(name, Number(defaultProfileId));
    if (updatedAccount) {
      res.status(200).json({
        message: `Updated account ${accountId}`,
        result: {
          id: updatedAccount.account_id,
          name: updatedAccount.account_name,
          email: updatedAccount.email,
          image: getAccountImage(updatedAccount),
          default_profile_id: updatedAccount.default_profile_id,
        },
      });
    } else {
      throw new BadRequestError('Failed to update the account');
    }
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

    const profile = new Profile(Number(accountId), name);
    await profile.save();

    if (profile.id) {
      res.status(201).json({
        message: 'Profile added successfully',
        result: { id: profile.id, name: profile.name, image: getProfileImage(profile) },
      });
    } else {
      throw new BadRequestError('Failed to add a profile');
    }
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

    const profile = await Profile.findById(Number(profileId));
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    const updatedProfile = await profile.update(name);
    if (updatedProfile) {
      res.status(200).json({
        message: 'Profile edited successfully',
        result: {
          id: updatedProfile.id,
          name: updatedProfile.name,
          image: getProfileImage(updatedProfile),
        },
      });
    } else {
      throw new BadRequestError('Failed to update profile');
    }
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
    const { profileId } = req.params as AccountAndProfileIdsParams;

    const profile = await Profile.findById(Number(profileId));
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    const deleted = await profile.delete();
    if (deleted) {
      res.status(204).json({ message: 'Profile deleted successfully' });
    } else {
      throw new BadRequestError('Failed to delete profile');
    }
  } catch (error) {
    next(error);
  }
});
