import { SearchParams } from '@ajgifford/keepwatching-common-server/schema/searchSchema';
import { MediaType, contentDiscoveryService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

/**
 * Search for shows
 *
 * @route GET /api/v1/search/shows
 */
export const searchShows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { searchString, year, page = '1' } = req.query as unknown as SearchParams;
    const searchResults = await contentDiscoveryService.searchMedia(MediaType.SHOW, searchString, year, page);
    res.status(200).json(searchResults);
  } catch (error) {
    next(error);
  }
};

/**
 * Search for movies
 *
 * @route GET /api/v1/search/movies
 */
export const searchMovies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { searchString, year, page = '1' } = req.query as unknown as SearchParams;
    const searchResults = await contentDiscoveryService.searchMedia(MediaType.MOVIE, searchString, year, page);
    res.status(200).json(searchResults);
  } catch (error) {
    next(error);
  }
};
