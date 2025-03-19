import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import Episode from '../models/episode';
import Movie from '../models/movie';
import Profile from '../models/profile';
import Show from '../models/show';
import {
  AccountIdParams,
  AccountProfileIdsParams,
  AccountUpdateParams,
  ProfileNameParams,
} from '../schema/accountSchema';
import { getAccountImage, getProfileImage } from '../utils/imageUtility';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

// GET /api/v1/accounts/${id}/profiles
export const getProfiles = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as AccountIdParams;

    const profiles = await Profile.getAllByAccountId(Number(id));
    if (profiles) {
      const responseProfiles = profiles.map((profile) => {
        return { id: profile.id, name: profile.name, image: getProfileImage(profile) };
      });
      res.status(200).json({ message: `Retrieved profiles for account ${id}`, results: responseProfiles });
    } else {
      throw new BadRequestError('Failed to get all profiles for an account');
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/accounts/${id}/profiles/${profileId}
export const getProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as AccountProfileIdsParams;

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

// PUT /api/v1/accounts/${id}
export const editAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as AccountIdParams;
    const { account_name, default_profile_id }: AccountUpdateParams = req.body;

    const account = await Account.findById(Number(id));
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const updatedAccount = await account.editAccount(account_name, Number(default_profile_id));
    if (updatedAccount) {
      res.status(200).json({
        message: `Updated account ${id}`,
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

// POST /api/v1/accounts/${id}/profiles
export const addProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as AccountIdParams;
    const { name }: ProfileNameParams = req.body;

    const profile = new Profile(Number(id), name);
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

// PUT /api/v1/accounts/${id}/profiles/${profileId}
export const editProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as AccountProfileIdsParams;
    const { name }: ProfileNameParams = req.body;

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

// DELETE /api/v1/accounts/${id}/profiles/${profileId}
export const deleteProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as AccountProfileIdsParams;

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
