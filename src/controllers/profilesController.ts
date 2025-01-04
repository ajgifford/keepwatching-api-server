import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware';
import Profile from '../models/profile';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

export const getAccountProfiles = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`GET /api/accounts/${id}/profiles`, req.body);
  const profiles = await Profile.getAllByAccountId(Number(id));
  if (profiles) {
    res.status(200).json({ message: `Retrieved profiles for account ${id}`, results: profiles });
  } else {
    throw new BadRequestError('Failed to get profiles for account');
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
      result: { id: profile.id, name: profile.name, showsToWatch: 0, showsWatching: 0, showsWatched: 0 },
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
    res.status(200).json({
      message: 'Profile edited successfully',
      result: {
        id: updatedProfile?.id,
        name: updatedProfile?.name,
      },
    });
  } else {
    throw new NotFoundError('Profile not found');
  }
});

export const deleteProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id, profileId } = req.params;
  console.log(`DELETE /api/accounts/${id}/profiles/${profileId}`);

  const profile = await Profile.findById(Number(profileId));
  if (profile) {
    const rows = await profile.delete(Number(profileId));
    res.status(204).json({ message: 'Profile deleted successfully' });
  } else {
    throw new NotFoundError('Profile not found');
  }
});
