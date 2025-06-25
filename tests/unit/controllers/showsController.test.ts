import { showService } from '@ajgifford/keepwatching-common-server/testing';
import {
  addFavorite,
  getProfileEpisodes,
  getShowDetails,
  getShowRecommendations,
  getShows,
  getSimilarShows,
  removeFavorite,
  updateShowWatchStatus,
} from '@controllers/showsController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({ showService: showService }));

describe('showsController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { accountId: 1, profileId: 123, showId: 456 },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getShows', () => {
    it('should get shows for a profile', async () => {
      const mockShows = [
        { showId: 1, title: 'Show 1', watchStatus: 'WATCHING' },
        { showId: 2, title: 'Show 2', watchStatus: 'NOT_WATCHED' },
      ];
      (showService.getShowsForProfile as jest.Mock).mockResolvedValue(mockShows);

      await getShows(req, res, next);

      expect(showService.getShowsForProfile).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved shows for a profile',
        shows: mockShows,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to get shows');
      (showService.getShowsForProfile as jest.Mock).mockRejectedValue(error);

      await getShows(req, res, next);

      expect(showService.getShowsForProfile).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getShowDetails', () => {
    it('should get show details for a profile', async () => {
      const mockShowDetails = {
        id: 456,
        title: 'Breaking Bad',
        description: 'A high school chemistry teacher turned meth cook',
        seasons: [{ seasonId: 1, name: 'Season 1' }],
      };
      (showService.getShowDetailsForProfile as jest.Mock).mockResolvedValue(mockShowDetails);

      await getShowDetails(req, res, next);

      expect(showService.getShowDetailsForProfile).toHaveBeenCalledWith(1, 123, 456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved a show and its details',
        showWithSeasons: mockShowDetails,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to get show details');
      (showService.getShowDetailsForProfile as jest.Mock).mockRejectedValue(error);

      await getShowDetails(req, res, next);

      expect(showService.getShowDetailsForProfile).toHaveBeenCalledWith(1, 123, 456);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getProfileEpisodes', () => {
    it('should get episode data for a profile', async () => {
      const mockEpisodeData = {
        recentEpisodes: [{ episodeId: 101, title: 'Recent Episode' }],
        upcomingEpisodes: [{ episodeId: 102, title: 'Upcoming Episode' }],
        nextUnwatchedEpisodes: [{ showId: 1, episodes: [{ episodeId: 103 }] }],
      };
      (showService.getEpisodesForProfile as jest.Mock).mockResolvedValue(mockEpisodeData);

      await getProfileEpisodes(req, res, next);

      expect(showService.getEpisodesForProfile).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved the episodes for a profile',
        episodes: mockEpisodeData,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to get episode data');
      (showService.getEpisodesForProfile as jest.Mock).mockRejectedValue(error);

      await getProfileEpisodes(req, res, next);

      expect(showService.getEpisodesForProfile).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('addFavorite', () => {
    it('should add a show to favorites', async () => {
      req.body = { showTMDBId: 789 };
      const mockResult = {
        favoritedShow: { showId: 789, title: 'New Show' },
        episodes: { recentEpisodes: [{ episodeId: 101 }], upcomingEpisodes: [{ episodeId: 102 }] },
      };
      (showService.addShowToFavorites as jest.Mock).mockResolvedValue(mockResult);

      await addFavorite(req, res, next);

      expect(showService.addShowToFavorites).toHaveBeenCalledWith(1, 123, 789);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully saved show as a favorite',
        addedShow: mockResult.favoritedShow,
        episodes: mockResult.episodes,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.body = { showTMDBId: 789 };
      const error = new Error('Failed to add show');
      (showService.addShowToFavorites as jest.Mock).mockRejectedValue(error);

      await addFavorite(req, res, next);

      expect(showService.addShowToFavorites).toHaveBeenCalledWith(1, 123, 789);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('removeFavorite', () => {
    it('should remove a show from favorites', async () => {
      const mockResult = {
        removedShow: { id: 456, title: 'Show to Remove' },
        episodes: { recentEpisodes: [{ episodeId: 101 }], upcomingEpisodes: [{ episodeId: 102 }] },
      };
      (showService.removeShowFromFavorites as jest.Mock).mockResolvedValue(mockResult);

      await removeFavorite(req, res, next);

      expect(showService.removeShowFromFavorites).toHaveBeenCalledWith(1, 123, 456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully removed the show from favorites',
        removedShowReference: mockResult.removedShow,
        episodes: mockResult.episodes,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to remove show');
      (showService.removeShowFromFavorites as jest.Mock).mockRejectedValue(error);

      await removeFavorite(req, res, next);

      expect(showService.removeShowFromFavorites).toHaveBeenCalledWith(1, 123, 456);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('updateShowWatchStatus', () => {
    it('should update show watch status', async () => {
      req.body = { showId: 456, status: 'WATCHED' };
      const mockResult = { nextUnwatchedEpisodes: [{ id: 789, title: 'Next Episode' }] };
      (showService.updateShowWatchStatus as jest.Mock).mockResolvedValue(mockResult);

      await updateShowWatchStatus(req, res, next);

      expect(showService.updateShowWatchStatus).toHaveBeenCalledWith(1, 123, 456, 'WATCHED');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Successfully updated the watch status to 'WATCHED'",
        statusData: mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.body = { showId: 456, status: 'WATCHED' };
      const error = new Error('Failed to update watch status');
      (showService.updateShowWatchStatus as jest.Mock).mockRejectedValue(error);

      await updateShowWatchStatus(req, res, next);

      expect(showService.updateShowWatchStatus).toHaveBeenCalledWith(1, 123, 456, 'WATCHED');
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getShowRecommendations', () => {
    it('should get recommendations for a show', async () => {
      const mockRecommendations = [
        { id: 101, title: 'Recommended Show 1' },
        { id: 102, title: 'Recommended Show 2' },
      ];
      (showService.getShowRecommendations as jest.Mock).mockResolvedValue(mockRecommendations);

      await getShowRecommendations(req, res, next);

      expect(showService.getShowRecommendations).toHaveBeenCalledWith(123, 456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved show recommendations',
        shows: mockRecommendations,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to get recommendations');
      (showService.getShowRecommendations as jest.Mock).mockRejectedValue(error);

      await getShowRecommendations(req, res, next);

      expect(showService.getShowRecommendations).toHaveBeenCalledWith(123, 456);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getSimilarShows', () => {
    it('should get similar shows', async () => {
      const mockSimilarShows = [
        { id: 201, title: 'Similar Show 1' },
        { id: 202, title: 'Similar Show 2' },
      ];
      (showService.getSimilarShows as jest.Mock).mockResolvedValue(mockSimilarShows);

      await getSimilarShows(req, res, next);

      expect(showService.getSimilarShows).toHaveBeenCalledWith(123, 456);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved similar shows',
        shows: mockSimilarShows,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to get similar shows');
      (showService.getSimilarShows as jest.Mock).mockRejectedValue(error);

      await getSimilarShows(req, res, next);

      expect(showService.getSimilarShows).toHaveBeenCalledWith(123, 456);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
