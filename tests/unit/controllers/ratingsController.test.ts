import { ratingsService } from '@ajgifford/keepwatching-common-server/services';
import { deleteRating, getRatingsForProfile, upsertRating } from '@controllers/ratingsController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  ratingsService: {
    getRatingsForProfile: jest.fn(),
    upsertRating: jest.fn(),
    deleteRating: jest.fn(),
  },
}));

describe('ratingsController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  const mockRating = {
    id: 1,
    profileId: 456,
    contentType: 'show',
    contentId: 42,
    contentTitle: 'Breaking Bad',
    posterImage: '/poster.jpg',
    rating: 5,
    note: 'Amazing!',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  };

  beforeEach(() => {
    req = {
      params: { accountId: 123, profileId: 456, ratingId: 1 },
      query: {},
      body: {
        contentType: 'show',
        contentId: 42,
        rating: 5,
        note: 'Amazing!',
        contentTitle: 'Breaking Bad',
        posterImage: '/poster.jpg',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getRatingsForProfile', () => {
    it('should return 200 with ratings array on success', async () => {
      (ratingsService.getRatingsForProfile as jest.Mock).mockResolvedValue([mockRating]);

      await getRatingsForProfile(req, res, next);

      expect(ratingsService.getRatingsForProfile).toHaveBeenCalledWith(456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved ratings for profile',
        ratings: [mockRating],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) when service throws', async () => {
      const error = new Error('DB error');
      (ratingsService.getRatingsForProfile as jest.Mock).mockRejectedValue(error);

      await getRatingsForProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('upsertRating', () => {
    it('should return 200 with saved rating on success', async () => {
      (ratingsService.upsertRating as jest.Mock).mockResolvedValue(mockRating);

      await upsertRating(req, res, next);

      expect(ratingsService.upsertRating).toHaveBeenCalledWith(456, 'show', 42, 5, 'Amazing!', 'Breaking Bad', '/poster.jpg');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Rating saved successfully',
        rating: mockRating,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) when service throws', async () => {
      const error = new Error('Upsert failed');
      (ratingsService.upsertRating as jest.Mock).mockRejectedValue(error);

      await upsertRating(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('deleteRating', () => {
    it('should return 200 on successful delete', async () => {
      (ratingsService.deleteRating as jest.Mock).mockResolvedValue(undefined);

      await deleteRating(req, res, next);

      expect(ratingsService.deleteRating).toHaveBeenCalledWith(456, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Rating deleted successfully' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) when service throws', async () => {
      const error = new Error('Rating not found');
      (ratingsService.deleteRating as jest.Mock).mockRejectedValue(error);

      await deleteRating(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
