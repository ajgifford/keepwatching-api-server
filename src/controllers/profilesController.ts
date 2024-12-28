import Profile from '../models/profile';
import { Request, Response } from 'express';

export const getAccountProfiles = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`GET /api/accounts/${id}/profiles`, req.body);
  try {
    const profiles = await Profile.getAllByAccountId(Number(id));
    res.status(200).json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching profiles.' });
  }
};

export const addProfile = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  console.log(`POST /api/accounts/${id}/profiles`, req.body);
  const profile = new Profile(Number(id), name);
  await profile.save();

  if (profile) {
    res.status(201).json({ id: profile.id, name: profile.name, showsToWatch: 0, showsWatching: 0, showsWatched: 0 });
  }
};

export const editProfile = async (req: Request, res: Response) => {
  const { id, profileId } = req.params;
  const { name } = req.body;
  console.log(`PUT /api/accounts/${id}/profiles/${profileId}`);

  const profile = await Profile.findById(Number(profileId));
  if (profile) {
    const updatedProfle = await profile.update(name);
    res
      .status(200)
      .json({ id: updatedProfle?.id, name: updatedProfle?.name, showsToWatch: 0, showsWatching: 0, showsWatched: 0 });
  } else {
    res.status(401).json({ message: 'Profile not found' });
  }
};

export const deleteProfile = async (req: Request, res: Response) => {
  const { id, profileId } = req.params;
  console.log(`DELETE /api/accounts/${id}/profiles/${profileId}`);

  const profile = await Profile.findById(Number(profileId));
  if (profile) {
    const rows = await profile.delete(Number(profileId));
    res.status(204).send();
  } else {
    res.status(401).json({ message: 'Profile not found' });
  }
};
