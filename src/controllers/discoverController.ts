import { DiscoverTopQuery } from '../schema/discoverSchema';
import { DiscoverAndSearchResponse, DiscoverAndSearchResult } from '../types/discoverAndSearchTypes';
import { axiosStreamingAPIInstance } from '../utils/axiosInstance';
import { AxiosError } from 'axios';
import { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });

// GET /api/v1/discover/top
export const discoverTopShows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { showType, service } = req.query as DiscoverTopQuery;

  const cacheKey = `discover_top_${showType}_${service}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    res.status(200).json(cachedData);
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
    const apiResults: any[] = response.data;
    const contentItems: DiscoverAndSearchResult[] = apiResults.map((result): DiscoverAndSearchResult => {
      const baseItem = {
        id: stripPrefix(result.tmdbId),
        title: result.title,
        genres: result.genres.map((genre: { name: any }) => genre.name),
        premiered: getPremieredDate(showType, result),
        summary: result.overview,
        image: result.imageSet.verticalPoster.w240,
        rating: result.rating,
      };
      return baseItem;
    });

    const discoverResponse: DiscoverAndSearchResponse = {
      message: `Found top ${showType} for ${service}`,
      results: contentItems,
      total_results: contentItems.length,
    };

    cache.set(cacheKey, discoverResponse);
    res.status(200).json(discoverResponse);
  } catch (error) {
    next(error);
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
