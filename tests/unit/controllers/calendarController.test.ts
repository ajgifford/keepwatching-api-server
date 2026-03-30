import { calendarService } from '@ajgifford/keepwatching-common-server/services';
import { getCalendarContent } from '@controllers/calendarController';

jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  calendarService: {
    getCalendarContentForProfile: jest.fn(),
  },
}));

describe('calendarController', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      params: { accountId: 1, profileId: 123 },
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getCalendarContent', () => {
    it('should get calendar content for a profile without date filters', async () => {
      const mockResults = {
        shows: [{ showId: 1, title: 'Show 1', episodes: [{ episodeId: 101, airDate: '2025-03-15' }] }],
        movies: [{ movieId: 2, title: 'Movie 1', releaseDate: '2025-03-20' }],
      };
      (calendarService.getCalendarContentForProfile as jest.Mock).mockResolvedValue(mockResults);

      await getCalendarContent(req, res, next);

      expect(calendarService.getCalendarContentForProfile).toHaveBeenCalledWith(123, undefined, undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved calendar content',
        results: mockResults,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should get calendar content for a profile with start and end date filters', async () => {
      req.query = { startDate: '2025-03-01', endDate: '2025-03-31' };
      const mockResults = {
        shows: [{ showId: 1, title: 'Show 1', episodes: [{ episodeId: 101, airDate: '2025-03-15' }] }],
        movies: [],
      };
      (calendarService.getCalendarContentForProfile as jest.Mock).mockResolvedValue(mockResults);

      await getCalendarContent(req, res, next);

      expect(calendarService.getCalendarContentForProfile).toHaveBeenCalledWith(123, '2025-03-01', '2025-03-31');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved calendar content',
        results: mockResults,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should get calendar content with only a start date', async () => {
      req.query = { startDate: '2025-03-01' };
      const mockResults = { shows: [], movies: [] };
      (calendarService.getCalendarContentForProfile as jest.Mock).mockResolvedValue(mockResults);

      await getCalendarContent(req, res, next);

      expect(calendarService.getCalendarContentForProfile).toHaveBeenCalledWith(123, '2025-03-01', undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved calendar content',
        results: mockResults,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to get calendar content');
      (calendarService.getCalendarContentForProfile as jest.Mock).mockRejectedValue(error);

      await getCalendarContent(req, res, next);

      expect(calendarService.getCalendarContentForProfile).toHaveBeenCalledWith(123, undefined, undefined);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
