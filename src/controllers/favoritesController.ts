import { Request, Response } from 'express';

export const addFavorite = async (req: Request, res: Response) => {
  const { id, profileId } = req.params;
  console.log(`POST /api/accounts/${id}/profiles/${profileId}/favorites`, req.body);
  res.status(200).json(req.body);
};
