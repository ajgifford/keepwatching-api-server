import { communityRecommendationsService } from '@ajgifford/keepwatching-common-server/services';
import {
  addRecommendation,
  getCommunityRecommendations,
  getProfileRecommendations,
  getRecommendationDetails,
  removeRecommendation,
} from '@controllers/communityRecommendationsController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  communityRecommendationsService: {
    getRecommendationsForProfile: jest.fn(),
    addRecommendation: jest.fn(),
    removeRecommendation: jest.fn(),
    getCommunityRecommendations: jest.fn(),
    getRecommendationDetails: jest.fn(),
  },
}));

describe('communityRecommendationsController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  const mockProfileRec = {
    id: 1,
    profileId: 456,
    contentType: 'show',
    contentId: 42,
    rating: 5,
    message: 'Must watch!',
    createdAt: '2026-04-01T00:00:00.000Z',
  };

  const mockCommunityRec = {
    id: 1,
    contentType: 'show',
    contentId: 42,
    contentTitle: 'Breaking Bad',
    posterImage: '/poster.jpg',
    releaseDate: '2008-01-20',
    genres: 'Drama',
    rating: 5,
    message: 'Must watch!',
    recommendationCount: 3,
    createdAt: '2026-04-01T00:00:00.000Z',
  };

  beforeEach(() => {
    req = {
      params: { accountId: 123, profileId: 456 },
      query: {},
      body: {
        contentType: 'show',
        contentId: 42,
        rating: 5,
        message: 'Must watch!',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProfileRecommendations', () => {
    it('should return 200 with profile recommendations', async () => {
      (communityRecommendationsService.getRecommendationsForProfile as jest.Mock).mockResolvedValue([mockProfileRec]);

      await getProfileRecommendations(req, res, next);

      expect(communityRecommendationsService.getRecommendationsForProfile).toHaveBeenCalledWith(456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved recommendations for profile',
        recommendations: [mockProfileRec],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) when service throws', async () => {
      const error = new Error('Service error');
      (communityRecommendationsService.getRecommendationsForProfile as jest.Mock).mockRejectedValue(error);

      await getProfileRecommendations(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('addRecommendation', () => {
    it('should return 201 with created recommendation', async () => {
      (communityRecommendationsService.addRecommendation as jest.Mock).mockResolvedValue(mockProfileRec);

      await addRecommendation(req, res, next);

      expect(communityRecommendationsService.addRecommendation).toHaveBeenCalledWith(456, 'show', 42, 5, 'Must watch!');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Recommendation added successfully',
        recommendation: mockProfileRec,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) on duplicate recommendation', async () => {
      const error = new Error('Already recommended');
      (communityRecommendationsService.addRecommendation as jest.Mock).mockRejectedValue(error);

      await addRecommendation(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('removeRecommendation', () => {
    it('should return 200 on successful remove', async () => {
      (communityRecommendationsService.removeRecommendation as jest.Mock).mockResolvedValue(undefined);

      await removeRecommendation(req, res, next);

      expect(communityRecommendationsService.removeRecommendation).toHaveBeenCalledWith(456, 'show', 42);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Recommendation removed successfully' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) when service throws', async () => {
      const error = new Error('Not found');
      (communityRecommendationsService.removeRecommendation as jest.Mock).mockRejectedValue(error);

      await removeRecommendation(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCommunityRecommendations', () => {
    it('should return 200 with anonymized list', async () => {
      (communityRecommendationsService.getCommunityRecommendations as jest.Mock).mockResolvedValue([mockCommunityRec]);

      await getCommunityRecommendations(req, res, next);

      expect(communityRecommendationsService.getCommunityRecommendations).toHaveBeenCalledWith(undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved community recommendations',
        recommendations: [mockCommunityRec],
      });
    });

    it('should pass contentType query param to the service', async () => {
      req.query = { contentType: 'show' };
      (communityRecommendationsService.getCommunityRecommendations as jest.Mock).mockResolvedValue([mockCommunityRec]);

      await getCommunityRecommendations(req, res, next);

      expect(communityRecommendationsService.getCommunityRecommendations).toHaveBeenCalledWith('show');
    });

    it('should call next(error) when service throws', async () => {
      const error = new Error('Service error');
      (communityRecommendationsService.getCommunityRecommendations as jest.Mock).mockRejectedValue(error);

      await getCommunityRecommendations(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getRecommendationDetails', () => {
    const mockDetails = [
      {
        profileId: 456,
        profileName: 'Alice',
        rating: 5,
        message: 'Must watch!',
        createdAt: '2026-04-01T00:00:00.000Z',
      },
    ];

    beforeEach(() => {
      req.params = { contentType: 'show', contentId: 42 };
    });

    it('should return 200 with recommendation details', async () => {
      (communityRecommendationsService.getRecommendationDetails as jest.Mock).mockResolvedValue(mockDetails);

      await getRecommendationDetails(req, res, next);

      expect(communityRecommendationsService.getRecommendationDetails).toHaveBeenCalledWith('show', 42);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Retrieved recommendation details',
        details: mockDetails,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next(error) when service throws', async () => {
      const error = new Error('Content not found');
      (communityRecommendationsService.getRecommendationDetails as jest.Mock).mockRejectedValue(error);

      await getRecommendationDetails(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
