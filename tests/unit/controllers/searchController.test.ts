import { MediaType, contentDiscoveryService } from '@ajgifford/keepwatching-common-server/services';
import { searchMovies, searchShows } from '@controllers/searchController';

jest.mock('@ajgifford/keepwatching-common-server/services/contentDiscoveryService');

describe('searchController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('searchShows', () => {
    it('should search for shows with all parameters', async () => {
      req.query = {
        searchString: 'Breaking Bad',
        year: '2008',
        page: '2',
      };

      const mockSearchResults = {
        results: [{ id: '123', title: 'Breaking Bad' }],
        total_pages: 5,
        total_results: 10,
        current_page: '2',
      };

      (contentDiscoveryService.searchMedia as jest.Mock).mockResolvedValue(mockSearchResults);

      await searchShows(req, res, next);

      expect(contentDiscoveryService.searchMedia).toHaveBeenCalledWith(MediaType.SHOW, 'Breaking Bad', '2008', '2');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSearchResults);
      expect(next).not.toHaveBeenCalled();
    });

    it('should search for shows with default page', async () => {
      req.query = {
        searchString: 'Breaking Bad',
        year: '2008',
      };

      const mockSearchResults = {
        results: [{ id: '123', title: 'Breaking Bad' }],
        total_pages: 5,
        total_results: 10,
        current_page: '1',
      };

      (contentDiscoveryService.searchMedia as jest.Mock).mockResolvedValue(mockSearchResults);

      await searchShows(req, res, next);

      expect(contentDiscoveryService.searchMedia).toHaveBeenCalledWith(MediaType.SHOW, 'Breaking Bad', '2008', '1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSearchResults);
    });

    it('should search for shows without year filter', async () => {
      req.query = {
        searchString: 'Breaking Bad',
        page: '1',
      };

      const mockSearchResults = {
        results: [{ id: '123', title: 'Breaking Bad' }],
        total_pages: 5,
        total_results: 10,
        current_page: '1',
      };

      (contentDiscoveryService.searchMedia as jest.Mock).mockResolvedValue(mockSearchResults);

      await searchShows(req, res, next);

      expect(contentDiscoveryService.searchMedia).toHaveBeenCalledWith(MediaType.SHOW, 'Breaking Bad', undefined, '1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSearchResults);
    });

    it('should handle errors properly', async () => {
      req.query = {
        searchString: 'Breaking Bad',
      };

      const error = new Error('Search failed');
      (contentDiscoveryService.searchMedia as jest.Mock).mockRejectedValue(error);

      await searchShows(req, res, next);

      expect(contentDiscoveryService.searchMedia).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('searchMovies', () => {
    it('should search for movies with all parameters', async () => {
      req.query = {
        searchString: 'Inception',
        year: '2010',
        page: '2',
      };

      const mockSearchResults = {
        results: [{ id: '456', title: 'Inception' }],
        total_pages: 5,
        total_results: 10,
        current_page: '2',
      };

      (contentDiscoveryService.searchMedia as jest.Mock).mockResolvedValue(mockSearchResults);

      await searchMovies(req, res, next);

      expect(contentDiscoveryService.searchMedia).toHaveBeenCalledWith(MediaType.MOVIE, 'Inception', '2010', '2');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSearchResults);
      expect(next).not.toHaveBeenCalled();
    });

    it('should search for movies with default page', async () => {
      req.query = {
        searchString: 'Inception',
        year: '2010',
      };

      const mockSearchResults = {
        results: [{ id: '456', title: 'Inception' }],
        total_pages: 5,
        total_results: 10,
        current_page: '1',
      };

      (contentDiscoveryService.searchMedia as jest.Mock).mockResolvedValue(mockSearchResults);

      await searchMovies(req, res, next);

      expect(contentDiscoveryService.searchMedia).toHaveBeenCalledWith(MediaType.MOVIE, 'Inception', '2010', '1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSearchResults);
    });

    it('should search for movies without year filter', async () => {
      req.query = {
        searchString: 'Inception',
        page: '1',
      };

      const mockSearchResults = {
        results: [{ id: '456', title: 'Inception' }],
        total_pages: 5,
        total_results: 10,
        current_page: '1',
      };

      (contentDiscoveryService.searchMedia as jest.Mock).mockResolvedValue(mockSearchResults);

      await searchMovies(req, res, next);

      expect(contentDiscoveryService.searchMedia).toHaveBeenCalledWith(MediaType.MOVIE, 'Inception', undefined, '1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSearchResults);
    });

    it('should handle errors properly', async () => {
      req.query = {
        searchString: 'Inception',
      };

      const error = new Error('Search failed');
      (contentDiscoveryService.searchMedia as jest.Mock).mockRejectedValue(error);

      await searchMovies(req, res, next);

      expect(contentDiscoveryService.searchMedia).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
