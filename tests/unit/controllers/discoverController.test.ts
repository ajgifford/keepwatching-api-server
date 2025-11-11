import { contentDiscoveryService } from '@ajgifford/keepwatching-common-server/services';
import { discoverChangesContent, discoverTopContent, discoverTrendingContent } from '@controllers/discoverController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  contentDiscoveryService: {
    discoverTopContent: jest.fn(),
    discoverChangesContent: jest.fn(),
    discoverTrendingContent: jest.fn(),
  },
}));

describe('discoverController', () => {
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

  describe('discoverTopContent', () => {
    it('should discover top content properly', async () => {
      req.query = {
        showType: 'movie',
        service: 'netflix',
      };

      const mockTopContent = {
        message: 'Found top movie for netflix',
        results: [{ id: '123', title: 'The Matrix' }],
        total_results: 1,
        total_pages: 1,
        current_page: 1,
      };

      (contentDiscoveryService.discoverTopContent as jest.Mock).mockResolvedValue(mockTopContent);

      await discoverTopContent(req, res, next);

      expect(contentDiscoveryService.discoverTopContent).toHaveBeenCalledWith('movie', 'netflix');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTopContent);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors properly', async () => {
      req.query = {
        showType: 'movie',
        service: 'netflix',
      };

      const error = new Error('Discovery failed');
      (contentDiscoveryService.discoverTopContent as jest.Mock).mockRejectedValue(error);

      await discoverTopContent(req, res, next);

      expect(contentDiscoveryService.discoverTopContent).toHaveBeenCalledWith('movie', 'netflix');
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('discoverChangesContent', () => {
    it('should discover changes content properly', async () => {
      req.query = {
        showType: 'movie',
        service: 'netflix',
        changeType: 'new',
      };

      const mockChangesContent = {
        message: 'Found new movie for netflix',
        results: [{ id: '123', title: 'The Matrix' }],
        total_results: 1,
        total_pages: 1,
        current_page: 1,
      };

      (contentDiscoveryService.discoverChangesContent as jest.Mock).mockResolvedValue(mockChangesContent);

      await discoverChangesContent(req, res, next);

      expect(contentDiscoveryService.discoverChangesContent).toHaveBeenCalledWith('movie', 'netflix', 'new');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockChangesContent);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors properly', async () => {
      req.query = {
        showType: 'movie',
        service: 'netflix',
        changeType: 'new',
      };

      const error = new Error('Discovery failed');
      (contentDiscoveryService.discoverChangesContent as jest.Mock).mockRejectedValue(error);

      await discoverChangesContent(req, res, next);

      expect(contentDiscoveryService.discoverChangesContent).toHaveBeenCalledWith('movie', 'netflix', 'new');
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('discoverTrendingContent', () => {
    it('should discover trending content with specified page', async () => {
      req.query = {
        showType: 'movie',
        page: '2',
      };

      const mockTrendingContent = {
        message: 'Found trending movie',
        results: [{ id: '123', title: 'The Matrix' }],
        total_results: 20,
        total_pages: 2,
        current_page: '2',
      };

      (contentDiscoveryService.discoverTrendingContent as jest.Mock).mockResolvedValue(mockTrendingContent);

      await discoverTrendingContent(req, res, next);

      expect(contentDiscoveryService.discoverTrendingContent).toHaveBeenCalledWith('movie', '2');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTrendingContent);
      expect(next).not.toHaveBeenCalled();
    });

    it('should discover trending content with default page', async () => {
      req.query = {
        showType: 'movie',
      };

      const mockTrendingContent = {
        message: 'Found trending movie',
        results: [{ id: '123', title: 'The Matrix' }],
        total_results: 20,
        total_pages: 2,
        current_page: 1,
      };

      (contentDiscoveryService.discoverTrendingContent as jest.Mock).mockResolvedValue(mockTrendingContent);

      await discoverTrendingContent(req, res, next);

      expect(contentDiscoveryService.discoverTrendingContent).toHaveBeenCalledWith('movie', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTrendingContent);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors properly', async () => {
      req.query = {
        showType: 'movie',
      };

      const error = new Error('Discovery failed');
      (contentDiscoveryService.discoverTrendingContent as jest.Mock).mockRejectedValue(error);

      await discoverTrendingContent(req, res, next);

      expect(contentDiscoveryService.discoverTrendingContent).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
