import * as showsDb from '@db/showsDb';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

jest.mock('@utils/db', () => {
  const mockPool = {
    execute: jest.fn(),
    getConnection: jest.fn(),
  };
  return {
    getDbPool: jest.fn(() => mockPool),
  };
});

describe('profileShowRepository', () => {
  let mockPool: any;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };

    mockPool = getDbPool();
    mockPool.execute.mockReset();
    mockPool.getConnection.mockReset();
    mockPool.getConnection.mockResolvedValue(mockConnection);
  });

  describe('getAllShowsForProfile', () => {
    it('should return shows for a profile', async () => {
      const mockShows = [
        {
          show_id: 1,
          title: 'Show 1',
          watch_status: 'WATCHED',
          last_episode_title: 'Last Episode',
          last_episode_air_date: '2023-01-01',
          last_episode_number: 10,
          last_episode_season: 1,
          next_episode_title: 'Next Episode',
          next_episode_air_date: '2023-01-08',
          next_episode_number: 11,
          next_episode_season: 1,
        },
        {
          show_id: 2,
          title: 'Show 2',
          watch_status: 'WATCHING',
          last_episode_title: null,
          last_episode_air_date: null,
          last_episode_number: null,
          last_episode_season: null,
          next_episode_title: null,
          next_episode_air_date: null,
          next_episode_number: null,
          next_episode_season: null,
        },
      ];

      mockPool.execute.mockResolvedValueOnce([mockShows as RowDataPacket[]]);

      const shows = await showsDb.getAllShowsForProfile('123');

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM profile_shows WHERE profile_id = ?', [123]);
      expect(shows).toHaveLength(2);
      expect(shows[0].title).toBe('Show 1');
      expect(shows[0].last_episode).toEqual({
        title: 'Last Episode',
        air_date: '2023-01-01',
        episode_number: 10,
        season_number: 1,
      });
      expect(shows[1].last_episode).toBeNull();
    });
  });

  describe('getShowForProfile', () => {
    it('should return a show for a profile', async () => {
      const mockShows = [
        {
          show_id: 1,
          title: 'Show 1',
          watch_status: 'WATCHED',
          last_episode_title: 'Last Episode',
          last_episode_air_date: '2023-01-01',
          last_episode_number: 10,
          last_episode_season: 1,
          next_episode_title: 'Next Episode',
          next_episode_air_date: '2023-01-08',
          next_episode_number: 11,
          next_episode_season: 1,
        },
      ];

      mockPool.execute.mockResolvedValueOnce([mockShows as RowDataPacket[]]);

      const show = await showsDb.getShowForProfile('123', 2);

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM profile_shows WHERE profile_id = ? AND show_id = ?',
        [123, 2],
      );
      expect(show.title).toBe('Show 1');
      expect(show.last_episode).toEqual({
        title: 'Last Episode',
        air_date: '2023-01-01',
        episode_number: 10,
        season_number: 1,
      });
    });
  });

  describe('getShowWithSeasonsForProfile', () => {
    it('should return a show for a profile with its seasons', () => {});
  });

  describe('getNextUnwatchedEpisodesForProfile', () => {
    it('should return the next unwatched episodes for a profile', () => {});
  });

  describe('getProfilesForShow', () => {
    it('should return the profiles that have a show favorited', () => {});
  });
});
