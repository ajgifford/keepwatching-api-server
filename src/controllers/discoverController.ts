import { axiosStreamingAPIInstance } from '../utils/axiosInstance';
import { Request, Response } from 'express';

export const discoverTopShows = async (req: Request, res: Response) => {
  console.log(`GET /api/discover/top`, req.query);
  const config = {
    params: {
      country: 'us',
      show_type: `${req.query.showType}`,
      service: `${req.query.service}`,
    },
  };
  const response = await axiosStreamingAPIInstance.get('/shows/top', config);
  res.status(200).json(response.data);
};
