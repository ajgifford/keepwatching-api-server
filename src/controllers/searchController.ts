import { SearchQuery } from '@ajgifford/keepwatching-common-server/schema';
import { contentDiscoveryService } from '@ajgifford/keepwatching-common-server/services';
import { MediaType } from '@ajgifford/keepwatching-types';
import { NextFunction, Request, Response } from 'express';

/**
 * Search for TV shows and series
 *
 * Searches for television shows and series using a text query with optional year filtering
 * and pagination support. Returns comprehensive show metadata including titles, descriptions,
 * ratings, and poster images suitable for search result display and content discovery.
 *
 * @route GET /api/v1/search/shows
 * @param {Request} req - Express request containing search query parameters
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @query {string} searchString - The search term to find TV shows (required, 1-100 characters)
 * @query {string} year - Filter results by first air date year in YYYY format (optional, 1900-2030)
 * @query {number} page - Page number for pagination (optional, default: 1, range: 1-1000)
 * @returns {Response} 200 with search results containing TV shows and pagination metadata
 * @throws {ValidationError} When search parameters are invalid or missing
 * @throws {Error} When search service fails or rate limits are exceeded
 * @example
 * // GET /api/v1/search/shows?searchString=Breaking%20Bad&year=2008&page=1
 * // Response:
 * {
 *   "results": [
 *     {
 *       "id": "1396",
 *       "title": "Breaking Bad",
 *       "summary": "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer...",
 *       "premiered": "2008-01-20",
 *       "rating": 9.5,
 *       "popularity": 369.594,
 *       "image": "/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
 *       "genres": ["Action", "Drama"],
 *     },
 *     {
 *       "id": "62560",
 *       "title": "Mr. Robot",
 *       "summary": "A contemporary and culturally resonant drama about a young programmer...",
 *       "premiered": "2015-06-24",
 *       "rating": 8.2,
 *       "popularity": 45.678,
 *       "image": "/oKIBhzZzDX07SiE2QDc4mOnWs6k.jpg",
 *       "genres": ["Action", "Sci-Fi"],
 *     }
 *   ],
 *   "totalResults": 42,
 *   "totalPages": 3,
 *   "currentPage": 1
 * }
 */
export const searchShows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { searchString, year, page = 1 } = req.query as unknown as SearchQuery;
    const searchResults = await contentDiscoveryService.searchMedia(MediaType.SHOW, searchString, year, page);
    res.status(200).json(searchResults);
  } catch (error) {
    next(error);
  }
};

/**
 * Search for movies
 *
 * Searches for movies using a text query with optional year filtering and pagination
 * support. Returns comprehensive movie metadata including titles, descriptions, ratings,
 * cast information, and poster images. Supports fuzzy matching for typos and handles
 * both exact and partial title matches with relevance ranking.
 *
 * @route GET /api/v1/search/movies
 * @param {Request} req - Express request containing search query parameters
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @query {string} searchString - The search term to find movies (required, 1-100 characters)
 * @query {string} year - Filter results by release year in YYYY format (optional, 1900-2030)
 * @query {number} page - Page number for pagination (optional, default: 1, range: 1-1000)
 * @returns {Response} 200 with search results containing movies and pagination metadata
 * @throws {ValidationError} When search parameters are invalid or missing
 * @throws {Error} When search service fails or rate limits are exceeded
 * @example
 * // GET /api/v1/search/movies?searchString=Inception&year=2010&page=1
 * // Response:
 * {
 *   "results": [
 *     {
 *       "id": "27205",
 *       "title": "Inception",
 *       "summary": "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious...",
 *       "premiered": "2010-07-16",
 *       "rating": 8.4,
 *       "popularity": 147.435,
 *       "image": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
 *       "genres": ["Action", 'Science Fiction"],
 *     },
 *     {
 *       "id": "155",
 *       "title": "The Dark Knight",
 *       "summary": "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon...",
 *       "premiered": "2008-07-18",
 *       "rating": 9.0,
 *       "popularity": 123.456,
 *       "image": "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
 *       "genres": ["Action"],
 *     }
 *   ],
 *   "totalResults": 156,
 *   "totalPages": 8,
 *   "currentPage": 1
 * }
 */
export const searchMovies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { searchString, year, page = 1 } = req.query as unknown as SearchQuery;
    const searchResults = await contentDiscoveryService.searchMedia(MediaType.MOVIE, searchString, year, page);
    res.status(200).json(searchResults);
  } catch (error) {
    next(error);
  }
};

/**
 * Search for people (actors, directors, producers, etc.)
 *
 * Searches for people using a text query with pagination support. Returns
 * basic person information suitable for search result display, including
 * profile images and known works.
 *
 * @route GET /api/v1/search/people
 * @param {Request} req - Express request containing search query parameters
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @query {string} searchString - The search term to find people (required)
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @returns {Response} 200 with search results containing people and pagination info
 * @throws {Error} When search fails or validation errors occur
 * @example
 * // GET /api/v1/search/people?searchString=Bryan%20Cranston&page=1
 * // Response:
 * {
 *   "results": [
 *     {
 *       "id": 17419,
 *       "name": "Bryan Cranston",
 *       "profileImage": "/7Jahy5LZX2Fo8fGJltMreAI49hC.jpg",
 *       "known_for": ["Breaking Bad"],
 *       "department": "Acting",
 *       "popularity": 45.678
 *     }
 *   ],
 *   "totalResults": 42,
 *   "totalPages": 3,
 *   "currentPage": 1
 * }
 */
export const searchPeople = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { searchString, page = 1 } = req.query as unknown as SearchQuery;
    const searchResults = await contentDiscoveryService.searchPeople(searchString, page);
    res.status(200).json(searchResults);
  } catch (error) {
    next(error);
  }
};
