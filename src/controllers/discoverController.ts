import { DiscoverChangesQuery, DiscoverTopQuery, DiscoverTrendingQuery } from '../schema/discoverSchema';
import { DiscoverAndSearchResponse, DiscoverAndSearchResult } from '../types/discoverAndSearchTypes';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { generateGenreArrayFromIds } from '../utils/genreUtility';
import { buildTMDBImagePath } from '../utils/imageUtility';
import { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import * as streamingAvailability from 'streaming-availability';

const cache = new NodeCache({ stdTTL: 300 });
const client = new streamingAvailability.Client(
  new streamingAvailability.Configuration({
    apiKey: `${process.env.STREAMING_API_KEY}`,
  }),
);

// GET /api/v1/discover/top
export const discoverTopContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { showType, service } = req.query as DiscoverTopQuery;

  const cacheKey = `discover_top_${showType}_${service}`;
  const cachedData = cache.get<DiscoverAndSearchResponse>(cacheKey);

  if (cachedData) {
    res.status(200).json(cachedData);
    return;
  }

  try {
    const data = await client.showsApi.getTopShows({
      country: 'us',
      service: service,
      showType: showType,
    });
    const contentItems: DiscoverAndSearchResult[] = data.map((result): DiscoverAndSearchResult => {
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

// GET /api/v1/discover/changes
export const discoverChangesContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { showType, service, changeType } = req.query as DiscoverChangesQuery;

  const cacheKey = `discover_changes_${showType}_${service}_${changeType}`;
  const cachedData = cache.get<DiscoverAndSearchResponse>(cacheKey);

  if (cachedData) {
    res.status(200).json(cachedData);
    return;
  }

  try {
    const data = await client.changesApi.getChanges({
      changeType: changeType,
      itemType: 'show',
      country: 'us',
      catalogs: [service],
      showType: showType,
      orderDirection: 'asc',
      includeUnknownDates: false,
    });

    const showsData = data.shows || {};
    const showIds = Object.keys(showsData);
    const contentItems: DiscoverAndSearchResult[] = [];
    for (const id of showIds) {
      const show = showsData[id];
      if (!show || !show.title) continue;

      contentItems.push({
        id: stripPrefix(show.tmdbId),
        title: show.title,
        genres: (show.genres || []).map((genre: { name: string }) => genre.name),
        premiered: getStreamingPremieredDate(showType, show),
        summary: show.overview || '',
        image: show.imageSet?.verticalPoster?.w240 || '',
        rating: show.rating || 0,
      });
    }

    const discoverResponse: DiscoverAndSearchResponse = {
      message: `Found ${changeType} ${showType} for ${service}`,
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

  const cacheKey = `discover_trending_${showType}_${page}`;
  const cachedData = cache.get<DiscoverAndSearchResponse>(cacheKey);

  if (cachedData) {
    res.status(200).json(cachedData);
    return;
  }

  try {
    const mediaType = showType === 'movie' ? 'movie' : 'tv';
    const tmdbResponse = await axiosTMDBAPIInstance.get(`/trending/${mediaType}/week`, {
      params: {
        page: page,
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
