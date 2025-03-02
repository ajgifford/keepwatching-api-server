import { DiscoverTopQuery, DiscoverTrendingQuery } from '../schema/discoverSchema';
import { DiscoverAndSearchResponse, DiscoverAndSearchResult } from '../types/discoverAndSearchTypes';
import { axiosStreamingAPIInstance, axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { generateGenreArrayFromIds } from '../utils/genreUtility';
import { buildTMDBImagePath } from '../utils/imageUtility';
import { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });

// GET /api/v1/discover/top
export const discoverTopContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { showType, service } = req.query as DiscoverTopQuery;

  const cacheKey = `discover_top_${showType}_${service}`;
  const cachedData = cache.get<DiscoverAndSearchResponse>(cacheKey);

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
      return {
        id: stripPrefix(result.tmdbId),
        title: result.title,
        genres: result.genres.map((genre: { name: any }) => genre.name),
        premiered: getStreamingPremieredDate(showType, result),
        summary: result.overview,
        image: result.imageSet.verticalPoster.w240,
        rating: result.rating,
      };
    });

    const discoverResponse: DiscoverAndSearchResponse = {
      message: `Found top ${showType} for ${service}`,
      results: contentItems,
      total_results: contentItems.length,
      total_pages: 1,
      current_page: 1,
    };

    cache.set(cacheKey, discoverResponse);
    res.status(200).json(discoverResponse);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/discover/trending
export const discoverTrendingContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { showType, page } = req.query as DiscoverTrendingQuery;

  const cacheKey = `discover_trending_${showType}`;
  const cachedData = cache.get<DiscoverAndSearchResponse>(cacheKey);

  if (cachedData) {
    res.status(200).json(cachedData);
    return;
  }

  try {
    const mediaType = showType === 'movie' ? 'movie' : 'tv';
    const tmdbResponse = await axiosTMDBAPIInstance.get(`/trending/${mediaType}/week`, {
      params: {
        page,
        language: 'en-US',
      },
    });
    const apiResults: any[] = tmdbResponse.data.results;
    const usResults =
      showType === 'movie'
        ? apiResults.filter((movie) => movie.original_language === 'en')
        : apiResults.filter((show) => show.origin_country && show.origin_country.includes('US'));
    const contentItems: DiscoverAndSearchResult[] = usResults.map((result): DiscoverAndSearchResult => {
      return {
        id: result.id,
        title: getTMDBItemName(showType, result),
        genres: generateGenreArrayFromIds(result.genre_ids),
        premiered: getTMDBPremieredDate(showType, result),
        summary: result.overview,
        image: buildTMDBImagePath(result.poster_path),
        rating: result.vote_average,
        popularity: result.popularity,
      };
    });

    const discoverResponse: DiscoverAndSearchResponse = {
      message: `Found trending ${showType}`,
      results: contentItems,
      total_results: tmdbResponse.data.total_results,
      total_pages: tmdbResponse.data.total_pages,
      current_page: page,
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

function getStreamingPremieredDate(showType: string, result: { firstAirYear?: any; releaseYear?: any }) {
  if (showType === 'movie') {
    return result.releaseYear;
  } else {
    return result.firstAirYear;
  }
}

function getTMDBPremieredDate(showType: string, result: { first_air_date?: any; release_date?: any }) {
  if (showType === 'movie') {
    return result.release_date;
  } else {
    return result.first_air_date;
  }
}

function getTMDBItemName(searchType: string, result: { name?: any; title?: any }) {
  if (searchType === 'movie') {
    return result.title;
  } else {
    return result.name;
  }
}
