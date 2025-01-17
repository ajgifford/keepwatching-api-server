import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import Movie from '../models/movie';
import Profile from '../models/profile';
import Show from '../models/show';
import { getAccountImage, getProfileImage } from '../utils/imageUtility';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

export const getProfiles = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`GET /api/accounts/${id}/profiles`, req.body);
  const profiles = await Profile.getAllByAccountId(Number(id));
  if (profiles) {
    const responseProfiles = profiles.map((profile) => {
      return { id: profile.id, name: profile.name, image: getProfileImage(profile) };
    });
    res.status(200).json({ message: `Retrieved profiles for account ${id}`, results: responseProfiles });
  } else {
    throw new BadRequestError('Failed to get all profiles for an account');
  }
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id, profileId } = req.params;
  console.log(`GET /api/accounts/${id}/profiles/${profileId}`, req.body);
  const profile = await Profile.findById(Number(profileId));
  if (profile) {
    const showResults = await Show.getAllShowsForProfile(profileId);
    const nextWatchResults = await Show.getNextWatchForProfile(profileId);
    const movieResults = await Movie.getAllMoviesForProfile(profileId);
    const recentMovieResuls = await Movie.getRecentMovieReleasesForProfile(profileId);
    const upcomingMovieResults = await Movie.getUpcomingMovieReleasesForProfile(profileId);
    res.status(200).json({
      message: `Retrieved profile with id: ${profileId}`,
      results: {
        profile: { id: profile.id, name: profile.name, image: getProfileImage(profile) },
        shows: showResults,
        nextWatch: nextWatchResults,
        movies: movieResults,
        recentMovies: recentMovieResuls,
        upcomingMovies: upcomingMovieResults,
      },
    });
  } else {
    throw new BadRequestError('Failed to get a profile');
  }
});

export const editAccount = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { account_name, default_profile_id } = req.body;
  console.log(`PUT /api/accounts/${id}`, req.body);
  const account = await Account.findById(Number(id));
  if (account) {
    const updatedAccount = await account.editAccount(account_name, Number(default_profile_id));
    if (updatedAccount) {
      res.status(200).send({
        message: `Updated the account ${id}`,
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
  } else {
    throw new NotFoundError('Failed to find the account for an update');
  }
});

export const addProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  console.log(`POST /api/accounts/${id}/profiles`, req.body);
  const profile = new Profile(Number(id), name);
  await profile.save();

  if (profile) {
    res.status(201).json({
      message: 'Profile added successfully',
      result: { id: profile.id, name: profile.name, image: getProfileImage(profile) },
    });
  } else {
    throw new BadRequestError('Failed to add a profile');
  }
});

export const editProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id, profileId } = req.params;
  const { name } = req.body;
  console.log(`PUT /api/accounts/${id}/profiles/${profileId}`);

  const profile = await Profile.findById(Number(profileId));
  if (profile) {
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
      throw new NotFoundError('Profile not found for an edit');
    }
  } else {
    throw new NotFoundError('Profile not found for an edit');
  }
});

export const deleteProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id, profileId } = req.params;
  console.log(`DELETE /api/accounts/${id}/profiles/${profileId}`);

  const profile = await Profile.findById(Number(profileId));
  if (profile) {
    const deleted = await profile.delete(Number(profileId));
    if (deleted) {
      res.status(204).json({ message: 'Profile deleted successfully' });
    } else {
      throw new NotFoundError('No Profile deleted');
    }
  } else {
    throw new NotFoundError('Profile not found for a delete');
  }
});
