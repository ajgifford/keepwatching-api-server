import { TMDBAPIError } from '../middleware/errorMiddleware';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import NodeCache from 'node-cache';

// Cache with 5 minute TTL for common requests
const tmdbCache = new NodeCache({ stdTTL: 300 });

/**
 * Interface for TMDB service operations
 * This service encapsulates all interactions with the TMDB API
 */
export interface TMDBService {
  /**
   * Search for TV shows matching the provided query
   * @param query - Search term
   * @param page - Page number of results (default: 1)
   * @param year - Optional year filter
   * @returns Search results from TMDB
   */
  searchShows(query: string, page?: number, year?: string): Promise<any>;

  /**
   * Search for movies matching the provided query
   * @param query - Search term
   * @param page - Page number of results (default: 1)
   * @param year - Optional year filter
   * @returns Search results from TMDB
   */
  searchMovies(query: string, page?: number, year?: string): Promise<any>;

  /**
   * Get detailed information about a TV show
   * @param id - TMDB ID of the show
   * @returns Show details with content ratings and watch providers
   */
  getShowDetails(id: number): Promise<any>;

  /**
   * Get detailed information about a movie
   * @param id - TMDB ID of the movie
   * @returns Movie details with release dates and watch providers
   */
  getMovieDetails(id: number): Promise<any>;

  /**
   * Get detailed information about a specific season of a TV show
   * @param showId - TMDB ID of the show
   * @param seasonNumber - Season number
   * @returns Season details including episodes
   */
  getSeasonDetails(showId: number, seasonNumber: number): Promise<any>;

  /**
   * Get trending shows or movies for the week
   * @param mediaType - Type of media ('tv' or 'movie')
   * @param page - Page number of results
   * @returns Trending content
   */
  getTrending(mediaType: 'tv' | 'movie', page?: string): Promise<any>;

  /**
   * Get changes for a specific show
   * @param showId - TMDB ID of the show
   * @param startDate - Start date for changes in YYYY-MM-DD format
   * @param endDate - End date for changes in YYYY-MM-DD format
   * @returns Changes for the show
   */
  getShowChanges(showId: number, startDate: string, endDate: string): Promise<any>;

  /**
   * Get changes for a specific movie
   * @param movieId - TMDB ID of the movie
   * @param startDate - Start date for changes in YYYY-MM-DD format
   * @param endDate - End date for changes in YYYY-MM-DD format
   * @returns Changes for the movie
   */
  getMovieChanges(movieId: number, startDate: string, endDate: string): Promise<any>;

  /**
   * Get changes for a specific season
   * @param seasonId - TMDB ID of the season
   * @param startDate - Start date for changes in YYYY-MM-DD format
   * @param endDate - End date for changes in YYYY-MM-DD format
   * @returns Changes for the season
   */
  getSeasonChanges(seasonId: number, startDate: string, endDate: string): Promise<any>;

  /**
   * Clear cache for specific items or all items if no key provided
   * @param key - Optional cache key to clear specific item
   */
  clearCache(key?: string): void;
}

/**
 * Implementation of TMDBService using Axios
 */
export class DefaultTMDBService implements TMDBService {
  async searchShows(query: string, page: number = 1, year?: string): Promise<any> {
    try {
      const params: Record<string, any> = {
        query,
        page,
        include_adult: false,
        language: 'en-US',
      };

      if (year) {
        params.first_air_date_year = year;
      }

      const response = await axiosTMDBAPIInstance.get('/search/tv', {
        params,
      });

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Error searching shows');
    }
  }

  async searchMovies(query: string, page: number = 1, year?: string): Promise<any> {
    try {
      const params: Record<string, any> = {
        query,
        page,
        include_adult: false,
        region: 'US',
        language: 'en-US',
      };

      if (year) {
        params.primary_release_year = year;
      }

      const response = await axiosTMDBAPIInstance.get('/search/movie', {
        params,
      });

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Error searching movies');
    }
  }

  async getShowDetails(id: number): Promise<any> {
    const cacheKey = `show_details_${id}`;
    const cachedResult = tmdbCache.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await axiosTMDBAPIInstance.get(`/tv/${id}?append_to_response=content_ratings,watch/providers`);
      tmdbCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Error fetching show details for ID: ${id}`);
    }
  }

  async getMovieDetails(id: number): Promise<any> {
    const cacheKey = `movie_details_${id}`;
    const cachedResult = tmdbCache.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await axiosTMDBAPIInstance.get(
        `/movie/${id}?append_to_response=release_dates%2Cwatch%2Fproviders&language=en-US`,
      );
      tmdbCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Error fetching movie details for ID: ${id}`);
    }
  }

  async getSeasonDetails(showId: number, seasonNumber: number): Promise<any> {
    const cacheKey = `season_details_${showId}_${seasonNumber}`;
    const cachedResult = tmdbCache.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await axiosTMDBAPIInstance.get(`/tv/${showId}/season/${seasonNumber}`);
      tmdbCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Error fetching season details for show ID: ${showId}, season: ${seasonNumber}`);
    }
  }

  async getTrending(mediaType: 'tv' | 'movie', page: string = '1'): Promise<any> {
    const cacheKey = `trending_${mediaType}_${page}`;
    const cachedResult = tmdbCache.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await axiosTMDBAPIInstance.get(`/trending/${mediaType}/week`, {
        params: {
          page,
          language: 'en-US',
        },
      });
      tmdbCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Error fetching trending ${mediaType}`);
    }
  }

  async getShowChanges(showId: number, startDate: string, endDate: string): Promise<any> {
    const cacheKey = `show_changes_${showId}_${startDate}_${endDate}`;
    const cachedResult = tmdbCache.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await axiosTMDBAPIInstance.get(
        `tv/${showId}/changes?end_date=${endDate}&start_date=${startDate}`,
      );
      tmdbCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Error fetching changes for show ID: ${showId}`);
    }
  }

  async getMovieChanges(movieId: number, startDate: string, endDate: string): Promise<any> {
    const cacheKey = `movie_changes_${movieId}_${startDate}_${endDate}`;
    const cachedResult = tmdbCache.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await axiosTMDBAPIInstance.get(
        `movie/${movieId}/changes?end_date=${endDate}&start_date=${startDate}`,
      );
      tmdbCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Error fetching changes for movie ID: ${movieId}`);
    }
  }

  async getSeasonChanges(seasonId: number, startDate: string, endDate: string): Promise<any> {
    const cacheKey = `season_changes_${seasonId}_${startDate}_${endDate}`;
    const cachedResult = tmdbCache.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await axiosTMDBAPIInstance.get(
        `tv/season/${seasonId}/changes?end_date=${endDate}&start_date=${startDate}`,
      );
      tmdbCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Error fetching changes for season ID: ${seasonId}`);
    }
  }

  clearCache(key?: string): void {
    if (key) {
      tmdbCache.del(key);
    } else {
      tmdbCache.flushAll();
    }
  }

  private handleApiError(error: any, customMessage: string): Error {
    if (error.isAxiosError && error.response && error.response.status === 429) {
      return error;
    }
    if (error.response && error.response.data && error.response.data.status_message) {
      return new TMDBAPIError(`${customMessage}: ${error.response.data.status_message}`, error);
    }
    return new TMDBAPIError(error instanceof Error ? error.message : customMessage, error);
  }
}

// Singleton instance for the application
let tmdbServiceInstance: TMDBService | null = null;

/**
 * Get the TMDBService instance
 * @returns TMDBService instance
 */
export const getTMDBService = (): TMDBService => {
  if (!tmdbServiceInstance) {
    tmdbServiceInstance = new DefaultTMDBService();
  }
  return tmdbServiceInstance;
};

// For testing
export const setTMDBService = (service: TMDBService): void => {
  tmdbServiceInstance = service;
};

export const resetTMDBService = (): void => {
  tmdbServiceInstance = null;
};
