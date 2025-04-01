import { SearchParams } from '../schema/searchSchema';
import { MediaType, contentDiscoveryService } from '../services/contentDiscoveryService';
import { NextFunction, Request, Response } from 'express';

// GET /api/v1/search/shows
export const searchShows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { searchString, year, page = '1' } = req.query as unknown as SearchParams;
    const searchResults = await contentDiscoveryService.searchMedia(MediaType.SHOW, searchString, year, page);
    res.status(200).json(searchResults);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/search/movies
export const searchMovies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { searchString, year, page = '1' } = req.query as unknown as SearchParams;
    const searchResults = await contentDiscoveryService.searchMedia(MediaType.MOVIE, searchString, year, page);
    res.status(200).json(searchResults);
  } catch (error) {
    next(error);
  }
};
