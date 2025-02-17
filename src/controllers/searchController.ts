import { cliLogger } from '../logger/logger';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { generateGenreArrayFromIds } from '../utils/genreUtility';
import { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { z } from 'zod';

const searchParamsSchema = z.object({
  searchString: z.string().min(1).max(100).trim(),
  year: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const cache = new NodeCache({ stdTTL: 300 });

// GET /api/v1/search/shows
export const searchShows = async (req: Request, res: Response): Promise<void> => {
  const validatedParams = searchParamsSchema.parse(req.query);
  const { searchString, year, page = 1 } = validatedParams;

  const cacheKey = `search_${searchString}_${year}_${page}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    res.status(200).json(cachedData);
    return;
  }

  const response = await axiosTMDBAPIInstance.get('/search/tv', {
    params: {
      query: searchString,
      page,
      first_air_date_year: year,
      include_adult: false,
      language: req.headers['accept-language'] || 'en-US',
    },
  });
  const results: any[] = response.data.results;
  const searchResult = results.map((result) => {
    return {
      id: result.id,
      title: result.name,
      genres: generateGenreArrayFromIds(result.genre_ids),
      premiered: result.first_air_date,
      summary: result.overview,
      image: result.poster_path,
      rating: result.vote_average,
      popularity: result.popularity,
    };
  });

  const responseData = {
    results: searchResult,
    total_pages: response.data.total_pages,
    total_results: response.data.total_results,
    current_page: page,
  };

  cache.set(cacheKey, responseData);
  res.status(200).json(responseData);
};

// GET /api/v1/search/movies
export const searchMovies = async (req: Request, res: Response) => {
  const validatedParams = searchParamsSchema.parse(req.query);
  const { searchString, year, page = 1 } = validatedParams;

  const response = await axiosTMDBAPIInstance.get('/search/movie', {
    params: {
      query: searchString,
      page,
      primary_release_year: year,
      include_adult: false,
      region: 'US',
      language: req.headers['accept-language'] || 'en-US',
    },
  });

  const results: any[] = response.data.results;
  const searchResult = results.map((result) => {
    return {
      id: result.id,
      title: result.title,
      genres: generateGenreArrayFromIds(result.genre_ids),
      premiered: result.release_date,
      summary: result.overview,
      image: result.poster_path,
      rating: result.vote_average,
    };
  });

  const responseData = {
    results: searchResult,
    total_pages: response.data.total_pages,
    total_results: response.data.total_results,
    current_page: page,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(responseData);
};
