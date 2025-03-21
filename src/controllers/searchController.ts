import { SearchParams } from '../schema/searchSchema';
import { getTMDBService } from '../services/tmdbService';
import { DiscoverAndSearchResult } from '../types/discoverAndSearchTypes';
import { generateGenreArrayFromIds } from '../utils/genreUtility';
import { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });

enum MediaType {
  SHOW = 'tv',
  MOVIE = 'movie',
}

// GET /api/v1/search/shows
export const searchShows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await searchMedia(req, res, next, MediaType.SHOW);
};

// GET /api/v1/search/movies
export const searchMovies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await searchMedia(req, res, next, MediaType.MOVIE);
};

async function searchMedia(req: Request, res: Response, next: NextFunction, mediaType: MediaType): Promise<void> {
  try {
    const { searchString, year, page = '1' } = req.query as unknown as SearchParams;

    const mediaTypeName = mediaType === MediaType.SHOW ? 'show' : 'movie';
    const cacheKey = `${mediaTypeName}_search_${searchString}_${year}_${page}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      res.status(200).json(cachedData);
      return;
    }

    const tmdbService = getTMDBService();
    const response =
      mediaType === MediaType.SHOW
        ? await tmdbService.searchShows(searchString, parseInt(page), year)
        : await tmdbService.searchMovies(searchString, parseInt(page), year);

    const results: any[] = response.results;
    const searchResult = results.map((result) => {
      return {
        id: result.id,
        title: mediaType === MediaType.MOVIE ? result.title : result.name,
        genres: generateGenreArrayFromIds(result.genre_ids),
        premiered: mediaType === MediaType.MOVIE ? result.release_date : result.first_air_date,
        summary: result.overview,
        image: result.poster_path,
        rating: result.vote_average,
        popularity: result.popularity,
      } as DiscoverAndSearchResult;
    });

    const responseData = {
      results: searchResult,
      total_pages: response.total_pages,
      total_results: response.total_results,
      current_page: page,
    };

    cache.set(cacheKey, responseData);
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
}
