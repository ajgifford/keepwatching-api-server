import { axiosTMDBAPIInstance } from '../utils/axiosInstance';

export interface TMDBService {
  searchShows(query: string, page?: number): Promise<any>;
  searchMovies(query: string, page?: number): Promise<any>;
  getShowDetails(id: number): Promise<any>;
  getMovieDetails(id: number): Promise<any>;
  getSeasonDetails(showId: number, seasonNumber: number): Promise<any>;
}

export class DefaultTMDBService implements TMDBService {
  async searchShows(query: string, page: number = 1): Promise<any> {
    const response = await axiosTMDBAPIInstance.get('/search/tv', {
      params: {
        query,
        page,
        include_adult: false,
        language: 'en-US',
      },
    });
    return response.data;
  }

  async searchMovies(query: string, page: number = 1): Promise<any> {
    const response = await axiosTMDBAPIInstance.get('/search/movie', {
      params: {
        query,
        page,
        include_adult: false,
        region: 'US',
        language: 'en-US',
      },
    });
    return response.data;
  }

  async getShowDetails(id: number): Promise<any> {
    const response = await axiosTMDBAPIInstance.get(`/tv/${id}?append_to_response=content_ratings,watch/providers`);
    return response.data;
  }

  async getMovieDetails(id: number): Promise<any> {
    const response = await axiosTMDBAPIInstance.get(
      `/movie/${id}?append_to_response=release_dates%2Cwatch%2Fproviders&language=en-US`,
    );
    return response.data;
  }

  async getSeasonDetails(showId: number, seasonNumber: number): Promise<any> {
    const response = await axiosTMDBAPIInstance.get(`/tv/${showId}/season/${seasonNumber}`);
    return response.data;
  }
}

// Singleton instance for the application
let tmdbServiceInstance: TMDBService | null = null;

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
