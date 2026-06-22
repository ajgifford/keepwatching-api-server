import { watchlistService } from '@ajgifford/keepwatching-common-server/services';
import {
  addWatchlistItem,
  getWatchlist,
  removeWatchlistItem,
  updateWatchlistPriorities,
} from '@controllers/watchlistController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  watchlistService: {
    getWatchlist: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updatePriorities: jest.fn(),
  },
}));

describe('watchlistController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  const mockItem = {
    id: 1,
    profileId: 456,
    contentType: 'show',
    contentId: 42,
    priority: 0,
    addedAt: '2026-06-01T00:00:00.000Z',
    title: 'Breaking Bad',
    posterImage: '/poster.jpg',
    genres: 'Drama, Crime',
    streamingServices: 'Netflix',
    runtime: 47,
    hasNewSeason: false,
  };

  beforeEach(() => {
    req = {
      params: { accountId: 123, profileId: 456, itemId: 1 },
      body: {
        contentType: 'show',
        contentId: 42,
        priorities: [
          { id: 1, priority: 0 },
          { id: 2, priority: 1 },
        ],
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getWatchlist', () => {
    it('should return 200 with watchlist on success', async () => {
      (watchlistService.getWatchlist as jest.Mock).mockResolvedValue([mockItem]);

      await getWatchlist(req, res, next);

      expect(watchlistService.getWatchlist).toHaveBeenCalledWith(456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved watchlist',
        watchlist: [mockItem],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 200 with empty watchlist when profile has no items', async () => {
      (watchlistService.getWatchlist as jest.Mock).mockResolvedValue([]);

      await getWatchlist(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved watchlist',
        watchlist: [],
      });
    });

    it('should call next(error) when service throws', async () => {
      const error = new Error('DB error');
      (watchlistService.getWatchlist as jest.Mock).mockRejectedValue(error);

      await getWatchlist(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('addWatchlistItem', () => {
    it('should return 201 with the created item on success', async () => {
      (watchlistService.addItem as jest.Mock).mockResolvedValue(mockItem);

      await addWatchlistItem(req, res, next);

      expect(watchlistService.addItem).toHaveBeenCalledWith(123, 456, 'show', 42);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully added item to watchlist',
        item: mockItem,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) when service throws', async () => {
      const error = new Error('Duplicate entry');
      (watchlistService.addItem as jest.Mock).mockRejectedValue(error);

      await addWatchlistItem(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('removeWatchlistItem', () => {
    it('should return 200 with success message on deletion', async () => {
      (watchlistService.removeItem as jest.Mock).mockResolvedValue(undefined);

      await removeWatchlistItem(req, res, next);

      expect(watchlistService.removeItem).toHaveBeenCalledWith(1, 456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Successfully removed item from watchlist' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) when service throws', async () => {
      const error = new Error('Item not found');
      (watchlistService.removeItem as jest.Mock).mockRejectedValue(error);

      await removeWatchlistItem(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('updateWatchlistPriorities', () => {
    it('should return 200 with success message after updating priorities', async () => {
      (watchlistService.updatePriorities as jest.Mock).mockResolvedValue(undefined);

      await updateWatchlistPriorities(req, res, next);

      expect(watchlistService.updatePriorities).toHaveBeenCalledWith(456, [
        { id: 1, priority: 0 },
        { id: 2, priority: 1 },
      ]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Successfully updated watchlist priorities' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) when service throws', async () => {
      const error = new Error('Transaction failed');
      (watchlistService.updatePriorities as jest.Mock).mockRejectedValue(error);

      await updateWatchlistPriorities(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
