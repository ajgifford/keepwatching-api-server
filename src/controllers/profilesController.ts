import { sampleProfiles } from '../mock_data/mock_account';
import { Request, Response } from 'express';

let autoId: number = 100;

export const getAccountProfiles = (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`GET /api/account/${id}/profiles`, req.body);
  res.json(sampleProfiles);
};

export const addProfile = (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`POST /api/account/${id}/profiles`, req.body);
  res.json(
    JSON.stringify({ id: `${autoId++}`, name: req.body.name, showsToWatch: 0, showsWatching: 0, showsWatched: 0 }),
  );
};

export const editProfile = (req: Request, res: Response) => {
  const { id, profileId } = req.params;
  console.log(`PUT /api/account/${id}/profiles/${profileId}`);
  res.json(
    JSON.stringify({ id: `${profileId}`, name: req.body.name, showsToWatch: 0, showsWatching: 0, showsWatched: 0 }),
  );
};

export const deleteProfile = (req: Request, res: Response) => {
  const { id, profileId } = req.params;
  console.log(`DELETE /api/account/${id}/profiles/${profileId}`);
  res.status(204).send();
};
