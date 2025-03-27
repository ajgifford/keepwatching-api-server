import { Change, ChangeItem, ContentUpdates } from '../../../src/types/contentTypes';
import { updateShows } from '@controllers/changesController';
import * as changesControllerModule from '@controllers/changesController';
import { cliLogger, httpLogger } from '@logger/logger';
import { ErrorMessages } from '@logger/loggerModel';
import Season from '@models/season';
import Show from '@models/show';
import { errorService } from '@services/errorService';
import { getTMDBService } from '@services/tmdbService';
import { getDbPool } from '@utils/db';
import { RowDataPacket } from 'mysql2';
import CronJob from 'node-cron';

jest.mock('@models/show');
jest.mock('@models/season');
jest.mock('@services/tmdbService');
jest.mock('@utils/db');

jest.mock('@utils/contentUtility', () => ({
  getUSRating: jest.fn(() => 'TV-MA'),
  getInProduction: jest.fn(() => 1),
  getEpisodeToAirId: jest.fn().mockImplementation((episode) => (episode ? episode.id : null)),
  getUSNetwork: jest.fn(() => 'Test Network'),
}));
jest.mock('@utils/watchProvidersUtility', () => ({
  getUSWatchProviders: jest.fn(() => [123, 456]),
}));

jest.mock('@services/errorService', () => ({
  errorService: {
    handleError: jest.fn((error) => error),
  },
}));

jest.mock('@logger/loggerModel', () => ({
  ErrorMessages: {
    SeasonChangeFail: 'Unexpected error while checking for season changes',
    ShowsChangeFail: 'Unexpected error while updating shows',
  },
}));

jest.mock('@logger/logger', () => ({
  cliLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  httpLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({
    start: jest.fn(),
  }),
}));

jest.mock('timers', () => ({
  setTimeout: (callback: Function) => callback(),
}));

describe('changesController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initScheduledJobs', () => {
    let mockNotifyShowUpdates: jest.Mock;
    let mockNotifyMovieUpdates: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();

      mockNotifyShowUpdates = jest.fn();
      mockNotifyMovieUpdates = jest.fn();
    });

    it('should initialize scheduled jobs with correct patterns', () => {
      changesControllerModule.initScheduledJobs(mockNotifyShowUpdates, mockNotifyMovieUpdates);

      expect(CronJob.schedule).toHaveBeenCalledTimes(2);
      expect(CronJob.schedule).toHaveBeenCalledWith('0 2 * * *', expect.any(Function));
      expect(CronJob.schedule).toHaveBeenCalledWith('0 1 7,14,21,28 * *', expect.any(Function));

      expect(CronJob.schedule('0 2 * * *', expect.any(Function)).start).toHaveBeenCalled();
      expect(CronJob.schedule('0 1 7,14,21,28 * *', expect.any(Function)).start).toHaveBeenCalled();

      expect(cliLogger.info).toHaveBeenCalledWith('Job Scheduler Initialized');
    });
  });

  describe('updateShowsGPT', () => {
    it('should process each show and call checkForShowChanges', async () => {
      const mockShows = [
        { id: 1, tmdb_id: 100 },
        { id: 2, tmdb_id: 200 },
      ];
      (Show.getShowsForUpdates as jest.Mock).mockResolvedValue(mockShows);
      const checkSpy = jest.spyOn(changesControllerModule, 'checkForShowChanges').mockResolvedValue(undefined);

      await updateShows();

      expect(Show.getShowsForUpdates).toHaveBeenCalled();
      expect(checkSpy).toHaveBeenCalledTimes(mockShows.length);
      expect(checkSpy).toHaveBeenCalledWith(mockShows[0], expect.any(String), expect.any(String));
    });
  });

  describe('updateShows', () => {
    let generateDateRangeSpy: jest.SpyInstance;

    const mockTMDBService = {
      getShowChanges: jest.fn(),
      getShowDetails: jest.fn(),
    };

    beforeEach(() => {
      // Mock the TMDB service first since it's needed by checkForShowChanges
      const mockTMDBService = {
        getShowChanges: jest.fn().mockResolvedValue({ changes: [] }),
        getShowDetails: jest.fn().mockResolvedValue({
          id: 101,
          name: 'Test Show',
          overview: 'Test description',
          first_air_date: '2023-01-01',
          poster_path: '/path/to/poster.jpg',
          backdrop_path: '/path/to/backdrop.jpg',
          vote_average: 8.5,
          content_ratings: { results: [] },
          number_of_episodes: 10,
          number_of_seasons: 2,
          genres: [{ id: 28 }],
          status: 'Running',
          type: 'Scripted',
          in_production: true,
          last_air_date: '2023-12-01',
          last_episode_to_air: { id: 1001 },
          next_episode_to_air: { id: 1002 },
          networks: [],
        }),
      };
      (getTMDBService as jest.Mock).mockReturnValue(mockTMDBService);

      generateDateRangeSpy = jest.spyOn(changesControllerModule, 'generateDateRange').mockImplementation(() => ({
        currentDate: '2023-05-15',
        pastDate: '2023-05-13',
      }));
    });

    it('should process all shows that need updates', async () => {
      const mockShows: ContentUpdates[] = [
        { id: 1, title: 'Show 1', tmdb_id: 101, created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: 2, title: 'Show 2', tmdb_id: 102, created_at: '2023-01-01', updated_at: '2023-01-01' },
      ];

      (Show.getShowsForUpdates as jest.Mock).mockResolvedValue(mockShows);

      await changesControllerModule.updateShows();

      expect(cliLogger.info).toHaveBeenCalledWith('Found 2 shows to check for updates');
      expect(mockTMDBService.getShowChanges).toHaveBeenCalledTimes(2);
      // expect(testSpy).toHaveBeenCalledWith(mockShows[0]);
      // expect(testSpy).toHaveBeenCalledWith(mockShows[1]);
    });

    it('should handle empty shows list', async () => {
      (Show.getShowsForUpdates as jest.Mock).mockResolvedValue([]);

      await changesControllerModule.updateShows();

      expect(cliLogger.info).toHaveBeenCalledWith('Found 0 shows to check for updates');
      expect(changesControllerModule.checkForShowChanges).not.toHaveBeenCalled();
    });

    it('should continue processing even if one show update fails', async () => {
      const mockShows: ContentUpdates[] = [
        { id: 1, title: 'Show 1', tmdb_id: 101, created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: 2, title: 'Show 2', tmdb_id: 102, created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: 3, title: 'Show 3', tmdb_id: 103, created_at: '2023-01-01', updated_at: '2023-01-01' },
      ];

      (Show.getShowsForUpdates as jest.Mock).mockResolvedValue(mockShows);

      (changesControllerModule.checkForShowChanges as jest.Mock)
        .mockResolvedValueOnce(undefined) // First show succeeds
        .mockRejectedValueOnce(new Error('Show update failed')) // Second show fails
        .mockResolvedValueOnce(undefined); // Third show succeeds

      await changesControllerModule.updateShows();

      expect(changesControllerModule.checkForShowChanges).toHaveBeenCalledTimes(3);
      expect(cliLogger.error).toHaveBeenCalledWith('Failed to check for changes in show ID 2', expect.any(Error));
    });

    it('should handle global error in getShowsForUpdates', async () => {
      const mockError = new Error('Database error');
      (Show.getShowsForUpdates as jest.Mock).mockRejectedValue(mockError);

      await expect(changesControllerModule.updateShows()).rejects.toThrow('Database error');

      expect(cliLogger.error).toHaveBeenCalledWith('Unexpected error while checking for show updates', mockError);
      expect(httpLogger.error).toHaveBeenCalledWith(ErrorMessages.ShowsChangeFail, { error: mockError });
    });

    it('should handle rate limiting between requests', async () => {
      const mockShows: ContentUpdates[] = [
        { id: 1, title: 'Show 1', tmdb_id: 101, created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: 2, title: 'Show 2', tmdb_id: 102, created_at: '2023-01-01', updated_at: '2023-01-01' },
      ];

      (Show.getShowsForUpdates as jest.Mock).mockResolvedValue(mockShows);

      const sleepSpy = jest.spyOn(global, 'setTimeout');

      await changesControllerModule.updateShows();

      expect(sleepSpy).toHaveBeenCalledTimes(2); // Once per show
      expect(sleepSpy).toHaveBeenCalledWith(expect.any(Function), 500);
    });
  });

  describe('checkForShowChanges', () => {
    let processSeasonChangesSpy: jest.SpyInstance;
    let updateShowWatchStatusSpy: jest.SpyInstance;

    const mockShow: ContentUpdates = {
      id: 123,
      title: 'Test Show',
      tmdb_id: 456,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    const mockTMDBService = {
      getShowChanges: jest.fn(),
      getShowDetails: jest.fn(),
    };

    const mockShowInstance = {
      update: jest.fn().mockResolvedValue(true),
      getProfilesForShow: jest.fn().mockResolvedValue([1, 2]),
    };

    beforeEach(() => {
      jest.clearAllMocks();

      processSeasonChangesSpy = jest
        .spyOn(changesControllerModule, 'processSeasonChanges')
        .mockImplementation(() => Promise.resolve());
      updateShowWatchStatusSpy = jest
        .spyOn(changesControllerModule, 'updateShowWatchStatusForNewContent')
        .mockImplementation(() => Promise.resolve());

      (getTMDBService as jest.Mock).mockReturnValue(mockTMDBService);
      (Show as any).mockImplementation(() => mockShowInstance);
    });

    it('should update show when changes are detected', async () => {
      const mockChangesData = {
        changes: [
          {
            key: 'name',
            items: [
              {
                id: '1',
                action: 'updated',
                time: '2023-06-10',
                value: 'New Show Name',
                original_value: 'Old Show Name',
                iso_639_1: 'en',
                iso_3166_1: 'US',
              },
            ],
          },
        ] as Change[],
      };

      const mockShowDetails = {
        id: 456,
        name: 'New Show Name',
        overview: 'Test description',
        first_air_date: '2023-01-01',
        poster_path: '/poster.jpg',
        backdrop_path: '/backdrop.jpg',
        vote_average: 8.5,
        content_ratings: {},
        number_of_episodes: 10,
        number_of_seasons: 2,
        genres: [{ id: 28 }, { id: 12 }],
        status: 'Running',
        type: 'Scripted',
        last_air_date: '2023-06-01',
        last_episode_to_air: { id: 789 },
        next_episode_to_air: { id: 790 },
        networks: [],
      };

      mockTMDBService.getShowChanges.mockResolvedValue(mockChangesData);
      mockTMDBService.getShowDetails.mockResolvedValue(mockShowDetails);

      await changesControllerModule.checkForShowChanges(mockShow, '2023-06-13', '2023-06-15');

      expect(mockTMDBService.getShowChanges).toHaveBeenCalledWith(456, '2023-06-13', '2023-06-15');
      expect(Show).toHaveBeenCalledWith(
        456,
        'New Show Name',
        'Test description',
        '2023-01-01',
        '/poster.jpg',
        '/backdrop.jpg',
        8.5,
        'TV-MA',
        123,
        [123, 456],
        10,
        2,
        [28, 12],
        'Running',
        'Scripted',
        1,
        '2023-06-01',
        789,
        790,
        'Test Network',
      );
      expect(mockShowInstance.update).toHaveBeenCalled();
      expect(mockShowInstance.getProfilesForShow).toHaveBeenCalled();
    });

    it('should not update show when no supported changes are found', async () => {
      const mockChangesData = {
        changes: [
          {
            key: 'some_unsupported_key',
            items: [
              {
                id: '1',
                action: 'updated',
                time: '2023-06-10',
                value: 'New Value',
                original_value: 'Old Value',
                iso_639_1: 'en',
                iso_3166_1: 'US',
              },
            ],
          },
        ] as Change[],
      };

      mockTMDBService.getShowChanges.mockResolvedValue(mockChangesData);

      await changesControllerModule.checkForShowChanges(mockShow, '2023-06-13', '2023-06-15');

      expect(mockTMDBService.getShowChanges).toHaveBeenCalledWith(456, '2023-06-13', '2023-06-15');
      expect(mockTMDBService.getShowDetails).not.toHaveBeenCalled();
      expect(Show).not.toHaveBeenCalled();
      expect(mockShowInstance.update).not.toHaveBeenCalled();
    });

    it('should handle empty changes array', async () => {
      mockTMDBService.getShowChanges.mockResolvedValue({ changes: [] });

      await changesControllerModule.checkForShowChanges(mockShow, '2023-06-13', '2023-06-15');

      expect(mockTMDBService.getShowDetails).not.toHaveBeenCalled();
      expect(Show).not.toHaveBeenCalled();
      expect(mockShowInstance.update).not.toHaveBeenCalled();
    });

    it('should handle undefined changes response', async () => {
      mockTMDBService.getShowChanges.mockResolvedValue({ changes: undefined });

      await changesControllerModule.checkForShowChanges(mockShow, '2023-06-13', '2023-06-15');

      expect(mockTMDBService.getShowDetails).not.toHaveBeenCalled();
      expect(Show).not.toHaveBeenCalled();
      expect(mockShowInstance.update).not.toHaveBeenCalled();
    });

    test('should recognize all supported change keys', async () => {
      const supportedKeys = [
        'air_date',
        'episode',
        'episode_number',
        'episode_run_time',
        'general',
        'genres',
        'images',
        'name',
        'network',
        'overview',
        'runtime',
        'season',
        'season_number',
        'status',
        'title',
        'type',
      ];

      const mockChanges: Change[] = supportedKeys.map((key) => ({
        key,
        items: [
          {
            id: '1',
            action: 'updated',
            time: '2023-06-10',
            value: 'New Value',
            original_value: 'Old Value',
            iso_639_1: 'en',
            iso_3166_1: 'US',
          },
        ],
      }));

      mockTMDBService.getShowChanges.mockResolvedValue({ changes: mockChanges });

      const mockShowDetails = {
        id: 456,
        name: 'New Show Name',
        overview: 'Test description',
        first_air_date: '2023-01-01',
        poster_path: '/poster.jpg',
        backdrop_path: '/backdrop.jpg',
        vote_average: 8.5,
        content_ratings: {},
        number_of_episodes: 10,
        number_of_seasons: 2,
        genres: [{ id: 28 }],
        status: 'Running',
        type: 'Scripted',
        last_air_date: '2023-06-01',
        last_episode_to_air: { id: 789 },
        next_episode_to_air: { id: 790 },
        networks: [],
      };

      mockTMDBService.getShowDetails.mockResolvedValue(mockShowDetails);

      await changesControllerModule.checkForShowChanges(mockShow, '2023-06-13', '2023-06-15');

      expect(mockTMDBService.getShowDetails).toHaveBeenCalled();
      expect(mockShowInstance.update).toHaveBeenCalled();
    });

    it('should handle if an error occurs in tmdbService.getShowChanges', async () => {
      const mockError = new Error('API error');
      mockTMDBService.getShowChanges.mockRejectedValue(mockError);

      await expect(changesControllerModule.checkForShowChanges(mockShow, '2023-06-13', '2023-06-15')).rejects.toThrow();

      expect(cliLogger.error).toHaveBeenCalledWith(`Error checking changes for show ID ${mockShow.id}`, mockError);
      expect(httpLogger.error).toHaveBeenCalledWith(ErrorMessages.ShowChangeFail, {
        error: mockError,
        showId: mockShow.id,
      });

      expect(errorService.handleError).toHaveBeenCalledWith(mockError, `checkForShowChanges(${mockShow.id})`);
    });

    it('should handle if an error occurs in tmdbService.getShowDetails', async () => {
      const mockChangesData = {
        changes: [
          {
            key: 'name',
            items: [
              {
                id: '1',
                action: 'updated',
                time: '2023-06-10',
                value: 'New Show Name',
                original_value: 'Old Show Name',
                iso_639_1: 'en',
                iso_3166_1: 'US',
              },
            ],
          },
        ] as Change[],
      };

      mockTMDBService.getShowChanges.mockResolvedValue(mockChangesData);
      mockTMDBService.getShowDetails.mockRejectedValue(new Error('API error in details'));

      await expect(changesControllerModule.checkForShowChanges(mockShow, '2023-06-13', '2023-06-15')).rejects.toThrow();

      expect(errorService.handleError).toHaveBeenCalledWith(expect.any(Error), `checkForShowChanges(${mockShow.id})`);
    });

    it('should handle if an error occurs in show.update', async () => {
      const mockChangesData = {
        changes: [
          {
            key: 'name',
            items: [
              {
                id: '1',
                action: 'updated',
                time: '2023-06-10',
                value: 'New Show Name',
                original_value: 'Old Show Name',
                iso_639_1: 'en',
                iso_3166_1: 'US',
              },
            ],
          },
        ] as Change[],
      };

      const mockShowDetails = {
        id: 456,
        name: 'New Show Name',
        overview: 'Test description',
        first_air_date: '2023-01-01',
        poster_path: '/poster.jpg',
        backdrop_path: '/backdrop.jpg',
        vote_average: 8.5,
        content_ratings: {},
        number_of_episodes: 10,
        number_of_seasons: 2,
        genres: [{ id: 28 }],
        status: 'Running',
        type: 'Scripted',
        last_air_date: null,
        last_episode_to_air: null,
        next_episode_to_air: null,
        networks: [],
      };

      mockTMDBService.getShowChanges.mockResolvedValue(mockChangesData);
      mockTMDBService.getShowDetails.mockResolvedValue(mockShowDetails);
      mockShowInstance.update.mockRejectedValue(new Error('Database error'));

      await expect(changesControllerModule.checkForShowChanges(mockShow, '2023-06-13', '2023-06-15')).rejects.toThrow();

      expect(errorService.handleError).toHaveBeenCalledWith(expect.any(Error), `checkForShowChanges(${mockShow.id})`);
    });

    it('should handle if an error occurs in show.getProfilesForShow', async () => {
      const mockChangesData = {
        changes: [
          {
            key: 'name',
            items: [
              {
                id: '1',
                action: 'updated',
                time: '2023-06-10',
                value: 'New Show Name',
                original_value: 'Old Show Name',
                iso_639_1: 'en',
                iso_3166_1: 'US',
              },
            ],
          },
        ] as Change[],
      };

      const mockShowDetails = {
        id: 456,
        name: 'New Show Name',
        overview: 'Test description',
        first_air_date: '2023-01-01',
        poster_path: '/poster.jpg',
        backdrop_path: '/backdrop.jpg',
        vote_average: 8.5,
        content_ratings: {},
        number_of_episodes: 10,
        number_of_seasons: 2,
        genres: [{ id: 28 }],
        status: 'Running',
        type: 'Scripted',
        last_air_date: '2023-06-01',
        last_episode_to_air: { id: 789 },
        next_episode_to_air: { id: 790 },
        networks: [],
      };

      mockTMDBService.getShowChanges.mockResolvedValue(mockChangesData);
      mockTMDBService.getShowDetails.mockResolvedValue(mockShowDetails);

      mockShowInstance.getProfilesForShow.mockRejectedValue(new Error('DB error getting profiles'));

      await expect(changesControllerModule.checkForShowChanges(mockShow, '2023-06-13', '2023-06-15')).rejects.toThrow();

      expect(mockShowInstance.update).toHaveBeenCalled();
      expect(errorService.handleError).toHaveBeenCalledWith(expect.any(Error), `checkForShowChanges(${mockShow.id})`);
    });
  });

  describe('checkSeasonForEpisodeChanges', () => {
    const mockTMDBService = {
      getSeasonChanges: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();

      (getTMDBService as jest.Mock).mockReturnValue(mockTMDBService);
    });

    it('should return true when season has episode changes', async () => {
      const mockChangesData = {
        changes: [
          {
            key: 'episode',
            items: [
              {
                id: '1',
                action: 'added',
                time: '2023-06-10',
                value: { episode_id: 123 },
                original_value: null,
                iso_639_1: 'en',
                iso_3166_1: 'US',
              },
            ],
          },
        ] as Change[],
      };

      mockTMDBService.getSeasonChanges.mockResolvedValue(mockChangesData);

      const result = await changesControllerModule.checkSeasonForEpisodeChanges(789, '2023-06-13', '2023-06-15');

      expect(result).toBe(true);
      expect(mockTMDBService.getSeasonChanges).toHaveBeenCalledWith(789, '2023-06-13', '2023-06-15');
    });

    it('should return false when season has no episode changes', async () => {
      const mockChangesData = {
        changes: [
          {
            key: 'name',
            items: [
              {
                id: '1',
                action: 'updated',
                time: '2023-06-10',
                value: 'New Season Name',
                original_value: 'Old Season Name',
                iso_639_1: 'en',
                iso_3166_1: 'US',
              },
            ],
          },
        ] as Change[],
      };

      mockTMDBService.getSeasonChanges.mockResolvedValue(mockChangesData);

      const result = await changesControllerModule.checkSeasonForEpisodeChanges(789, '2023-06-13', '2023-06-15');

      expect(result).toBe(false);
    });

    it('should return false when season has no changes', async () => {
      const mockChangesData = {
        changes: [] as Change[],
      };

      mockTMDBService.getSeasonChanges.mockResolvedValue(mockChangesData);
      const result = await changesControllerModule.checkSeasonForEpisodeChanges(789, '2023-06-13', '2023-06-15');

      expect(result).toBe(false);
    });

    it('should return false when API returns undefined changes', async () => {
      const mockChangesData = {
        changes: undefined,
      };

      mockTMDBService.getSeasonChanges.mockResolvedValue(mockChangesData);

      const result = await changesControllerModule.checkSeasonForEpisodeChanges(789, '2023-06-13', '2023-06-15');

      expect(result).toBe(false);
    });

    it('should handle error and return false', async () => {
      const mockError = new Error('API error');
      mockTMDBService.getSeasonChanges.mockRejectedValue(mockError);

      const result = await changesControllerModule.checkSeasonForEpisodeChanges(789, '2023-06-13', '2023-06-15');

      expect(result).toBe(false);
      expect(cliLogger.error).toHaveBeenCalledWith('Error checking changes for season ID 789', mockError);
      expect(httpLogger.error).toHaveBeenCalledWith(ErrorMessages.SeasonChangeFail, {
        error: mockError,
        seasonId: 789,
      });
    });

    it('should handle different types of changes', async () => {
      const mockChangesData = {
        changes: [
          {
            key: 'name',
            items: [
              {
                id: '1',
                action: 'updated',
                time: '2023-06-10',
                value: 'New Name',
                original_value: 'Old Name',
                iso_639_1: 'en',
                iso_3166_1: 'US',
              },
            ],
          },
          {
            key: 'episode',
            items: [
              {
                id: '2',
                action: 'added',
                time: '2023-06-12',
                value: { episode_id: 456 },
                original_value: null,
                iso_639_1: 'en',
                iso_3166_1: 'US',
              },
            ],
          },
          {
            key: 'overview',
            items: [
              {
                id: '3',
                action: 'updated',
                time: '2023-06-13',
                value: 'New overview',
                original_value: 'Old overview',
                iso_639_1: 'en',
                iso_3166_1: 'US',
              },
            ],
          },
        ] as Change[],
      };

      mockTMDBService.getSeasonChanges.mockResolvedValue(mockChangesData);

      const result = await changesControllerModule.checkSeasonForEpisodeChanges(789, '2023-06-13', '2023-06-15');

      expect(result).toBe(true); // Should return true because there is an 'episode' change
    });
  });

  describe('updateShowWatchStatusForNewContent', () => {
    const mockExecute = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();

      (getDbPool as jest.Mock).mockReturnValue({
        execute: mockExecute,
      });
    });

    it('should update show status from WATCHED to WATCHING for profiles with new content', async () => {
      mockExecute.mockResolvedValue([[{ status: 'WATCHED' }] as RowDataPacket[]]);

      await changesControllerModule.updateShowWatchStatusForNewContent(123, [1, 2]);

      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT status FROM show_watch_status WHERE profile_id = ? AND show_id = ?',
        [1, 123],
      );
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT status FROM show_watch_status WHERE profile_id = ? AND show_id = ?',
        [2, 123],
      );
      expect(Show.updateWatchStatus).toHaveBeenCalledTimes(2);
      expect(Show.updateWatchStatus).toHaveBeenCalledWith('1', 123, 'WATCHING');
      expect(Show.updateWatchStatus).toHaveBeenCalledWith('2', 123, 'WATCHING');
    });

    it('should not update show status if already set to something other than WATCHED', async () => {
      mockExecute.mockResolvedValueOnce([[{ status: 'WATCHING' }] as RowDataPacket[]]);
      mockExecute.mockResolvedValueOnce([[{ status: 'NOT_WATCHED' }] as RowDataPacket[]]);

      await changesControllerModule.updateShowWatchStatusForNewContent(123, [1, 2]);

      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should do nothing if profile has no watch status record', async () => {
      mockExecute.mockResolvedValue([[]]);

      await changesControllerModule.updateShowWatchStatusForNewContent(123, [1]);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should handle database error gracefully', async () => {
      const dbError = new Error('Database error');
      mockExecute.mockRejectedValue(dbError);

      await changesControllerModule.updateShowWatchStatusForNewContent(123, [1]);

      expect(cliLogger.error).toHaveBeenCalledWith('Error updating show watch status for new content', dbError);
    });

    it('should handle empty profile list', async () => {
      await changesControllerModule.updateShowWatchStatusForNewContent(123, []);
      expect(mockExecute).not.toHaveBeenCalled();
      expect(Show.updateWatchStatus).not.toHaveBeenCalled();
    });

    it('should process multiple profiles with mixed statuses', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ status: 'WATCHED' }] as RowDataPacket[]])
        .mockResolvedValueOnce([[{ status: 'WATCHING' }] as RowDataPacket[]])
        .mockResolvedValueOnce([[{ status: 'WATCHED' }] as RowDataPacket[]])
        .mockResolvedValueOnce([[] as RowDataPacket[]]);

      await changesControllerModule.updateShowWatchStatusForNewContent(123, [1, 2, 3, 4]);

      expect(mockExecute).toHaveBeenCalledTimes(4);
      expect(Show.updateWatchStatus).toHaveBeenCalledTimes(2);
      expect(Show.updateWatchStatus).toHaveBeenCalledWith('1', 123, 'WATCHING');
      expect(Show.updateWatchStatus).toHaveBeenCalledWith('3', 123, 'WATCHING');
    });
  });

  describe('updateSeasonWatchStatusForNewEpisodes', () => {
    const mockExecute = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();

      (getDbPool as jest.Mock).mockReturnValue({
        execute: mockExecute,
      });
    });

    it('should update season status from WATCHED to WATCHING when new episodes added', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ status: 'WATCHED' }] as RowDataPacket[]])
        .mockResolvedValueOnce([[{ show_id: 456 }] as RowDataPacket[]]);

      await changesControllerModule.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT status FROM season_watch_status WHERE profile_id = ? AND season_id = ?',
        ['123', 789],
      );
      expect(mockExecute).toHaveBeenCalledWith('SELECT show_id FROM seasons WHERE id = ?', [789]);
      expect(Season.updateWatchStatus).toHaveBeenCalledWith('123', 789, 'WATCHING');
      expect(Show.updateWatchStatusBySeason).toHaveBeenCalledWith('123', 456);
    });

    it('should not update season status if already set to something other than WATCHED', async () => {
      mockExecute.mockResolvedValueOnce([[{ status: 'WATCHING' }] as RowDataPacket[]]);

      await changesControllerModule.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      expect(Season.updateWatchStatus).not.toHaveBeenCalled();
      expect(Show.updateWatchStatusBySeason).not.toHaveBeenCalled();
    });

    it('should do nothing if season has no watch status record', async () => {
      mockExecute.mockResolvedValueOnce([[]]);

      await changesControllerModule.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      expect(Season.updateWatchStatus).not.toHaveBeenCalled();
      expect(Show.updateWatchStatusBySeason).not.toHaveBeenCalled();
    });

    it('should handle error when querying season status', async () => {
      const dbError = new Error('Database error');
      mockExecute.mockRejectedValue(dbError);

      await changesControllerModule.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(cliLogger.error).toHaveBeenCalledWith('Error updating season watch status for new episodes', dbError);
    });

    it('should handle error when querying show ID', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ status: 'WATCHED' }] as RowDataPacket[]])
        .mockRejectedValueOnce(new Error('Cannot find show ID'));

      await changesControllerModule.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.updateWatchStatus).toHaveBeenCalledWith('123', 789, 'WATCHING');
      expect(cliLogger.error).toHaveBeenCalledWith(
        'Error updating season watch status for new episodes',
        expect.any(Error),
      );
    });

    it('should handle empty show ID result', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ status: 'WATCHED' }] as RowDataPacket[]])
        .mockResolvedValueOnce([[] as RowDataPacket[]]);

      await changesControllerModule.updateSeasonWatchStatusForNewEpisodes('123', 789);

      expect(Season.updateWatchStatus).toHaveBeenCalledWith('123', 789, 'WATCHING');
      expect(Show.updateWatchStatusBySeason).not.toHaveBeenCalled();
    });
  });

  describe('filterUniqueSeasonIds', () => {
    it('should return empty array when changes array is empty', () => {
      const changes: ChangeItem[] = [];
      const result = changesControllerModule.filterUniqueSeasonIds(changes);
      expect(result).toEqual([]);
    });

    it('should extract unique season IDs from change items', () => {
      const changes: ChangeItem[] = [
        {
          id: '1',
          action: 'added',
          time: '2023-06-15',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          value: { season_id: 123 },
          original_value: null,
        },
        {
          id: '2',
          action: 'updated',
          time: '2023-06-15',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          value: { season_id: 456 },
          original_value: { season_id: 456 },
        },
        {
          id: '3',
          action: 'added',
          time: '2023-06-16',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          value: { season_id: 123 }, // Duplicate ID
          original_value: null,
        },
      ];

      const result = changesControllerModule.filterUniqueSeasonIds(changes);
      expect(result).toEqual([123, 456]);
      expect(result.length).toBe(2); // Check that duplicates are removed
    });

    it('should ignore changes without season_id', () => {
      const changes: ChangeItem[] = [
        {
          id: '1',
          action: 'added',
          time: '2023-06-15',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          value: { season_id: 123 },
          original_value: null,
        },
        {
          id: '2',
          action: 'updated',
          time: '2023-06-15',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          value: { some_other_property: 'value' }, // No season_id
          original_value: null,
        },
        {
          id: '3',
          action: 'deleted',
          time: '2023-06-16',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          value: null, // No season_id
          original_value: { season_id: 789 },
        },
      ];

      const result = changesControllerModule.filterUniqueSeasonIds(changes);
      expect(result).toEqual([123]);
      expect(result.length).toBe(1);
    });

    it('should handle changes with undefined or null values', () => {
      const changes: ChangeItem[] = [
        {
          id: '1',
          action: 'added',
          time: '2023-06-15',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          value: undefined,
          original_value: null,
        },
        {
          id: '2',
          action: 'updated',
          time: '2023-06-15',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          value: null,
          original_value: null,
        },
      ];

      const result = changesControllerModule.filterUniqueSeasonIds(changes);
      expect(result).toEqual([]);
    });

    it('should handle mixed types of changes', () => {
      const changes: ChangeItem[] = [
        {
          id: '1',
          action: 'added',
          time: '2023-06-15',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          value: { season_id: 123 },
          original_value: null,
        },
        {
          id: '2',
          action: 'updated',
          time: '2023-06-15',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          value: null,
          original_value: null,
        },
        {
          id: '3',
          action: 'deleted',
          time: '2023-06-16',
          iso_639_1: 'en',
          iso_3166_1: 'US',
          value: { season_id: 456 },
          original_value: { season_id: 789 },
        },
      ];

      const result = changesControllerModule.filterUniqueSeasonIds(changes);
      expect(result).toEqual([123, 456]);
    });
  });
});
