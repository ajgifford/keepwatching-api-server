import { DiscoverChangesQuery, DiscoverTopQuery, DiscoverTrendingQuery } from '../schema/discoverSchema';
import { getTMDBService } from '../services/tmdbService';
import { DiscoverAndSearchResponse, DiscoverAndSearchResult } from '../types/discoverAndSearchTypes';
import { getStreamingPremieredDate, getTMDBItemName, getTMDBPremieredDate, stripPrefix } from '../utils/contentUtility';
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
  try {
    const { showType, service } = req.query as DiscoverTopQuery;

    const cacheKey = `discover_top_${showType}_${service}`;
    const cachedData = cache.get<DiscoverAndSearchResponse>(cacheKey);

    if (cachedData) {
      res.status(200).json(cachedData);
      return;
    }

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
  try {
    const { showType, service, changeType } = req.query as DiscoverChangesQuery;

    const cacheKey = `discover_changes_${showType}_${service}_${changeType}`;
    const cachedData = cache.get<DiscoverAndSearchResponse>(cacheKey);

    if (cachedData) {
      res.status(200).json(cachedData);
      return;
    }

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
  try {
    const { showType, page = '1' } = req.query as DiscoverTrendingQuery;

    const cacheKey = `discover_trending_${showType}_${page}`;
    const cachedData = cache.get<DiscoverAndSearchResponse>(cacheKey);

    if (cachedData) {
      res.status(200).json(cachedData);
      return;
    }

    const mediaType = showType === 'movie' ? 'movie' : 'tv';

    const tmdbService = getTMDBService();
    const tmdbResponse = await tmdbService.getTrending(mediaType, page);

    const apiResults: any[] = tmdbResponse.results;
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
      total_results: tmdbResponse.total_results,
      total_pages: tmdbResponse.total_pages,
      current_page: page,
    };

    cache.set(cacheKey, discoverResponse);
    res.status(200).json(discoverResponse);
  } catch (error) {
    next(error);
  }
};
