import { BadRequestError } from '../middleware/errorMiddleware';
import { axiosStreamingAPIInstance } from '../utils/axiosInstance';
import { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { z } from 'zod';

const validServices = ['netflix', 'disney', 'hbo', 'apple', 'prime'];
const validTypes = ['movie', 'series'];

const DiscoverQuerySchema = z.object({
  showType: z.enum(['movie', 'series'], {
    errorMap: () => ({ message: 'Show type must be either "movie" or "series"' }),
  }),
  service: z.enum(['netflix', 'disney', 'hbo', 'apple', 'prime'], {
    errorMap: () => ({ message: 'Invalid streaming service provided' }),
  }),
});

type DiscoverQuery = z.infer<typeof DiscoverQuerySchema>;
const cache = new NodeCache({ stdTTL: 300 });

export const validateDiscoverQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = DiscoverQuerySchema.safeParse(req.query);

    if (!result.success) {
      const errorMessage = result.error.issues.map((issue) => issue.message).join(', ');

      next(new BadRequestError(errorMessage));
      return;
    }

    req.query = result.data;
    next();
  } catch (error) {
    next(new BadRequestError('Invalid request parameters'));
  }
};

// GET /api/v1/discover/top
export const discoverTopShows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { showType, service } = req.query as DiscoverQuery;

  const cacheKey = `discover_${showType}_${service}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    res.status(200).json({ message: `Found top ${showType} for ${service}`, results: cachedData });
    return;
  }

  const config = {
    params: {
      country: 'us',
      show_type: showType,
      service: service,
    },
  };
  try {
    const response = await axiosStreamingAPIInstance.get('/shows/top', config);
    const results: any[] = response.data;
    const searchResult = results.map((result) => {
      return {
        id: stripPrefix(result.tmdbId),
        title: result.title,
        genres: result.genres.map((genre: { name: any }) => genre.name),
        premiered: getPremieredDate(showType, result),
        summary: result.overview,
        image: result.imageSet.verticalPoster.w240,
        rating: result.rating,
      };
    });
    cache.set(cacheKey, searchResult);
    res.status(200).json({ message: `Found top ${showType} for ${service}`, results: searchResult });
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while discovering top content', error: error });
  }
};

function stripPrefix(input: string): string {
  return input.replace(/^(tv\/|movie\/)/, '');
}

function getPremieredDate(searchType: string, result: { firstAirYear?: any; releaseYear?: any }) {
  if (searchType === 'movie') {
    return result.releaseYear;
  } else {
    return result.firstAirYear;
  }
}
