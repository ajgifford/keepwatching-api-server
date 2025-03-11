// tests/unit/models/show.test.ts
import Show from '@models/show';
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

describe('Show class', () => {
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

  describe('save()', () => {
    test('save() should insert show into DB with transaction', async () => {
      mockConnection.execute.mockResolvedValueOnce([{ insertId: 5, affectedRows: 1 } as ResultSetHeader]);
      const show = new Show(
        12345, // tmdbId
        'Test Show', // title
        'Test description', // description
        '2023-01-01', // releaseDate
        '/path/to/poster.jpg', // posterImage
        '/path/to/backdrop.jpg', // backdropImage
        8.5, // userRating
        'TV-MA', // contentRating
        undefined, // id
        [1, 2], // streamingServices
        10, // episodeCount
        2, // seasonCount
        [28, 18], // genreIds
        'Running', // status
        'Scripted', // type
        1, // inProduction
        '2023-12-01', // lastAirDate
        1001, // lastEpisodeToAir
        1002, // nextEpisodeToAir
        'Test Network', // network
      );

      const result = await show.save();

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO shows'),
        expect.arrayContaining([
          12345,
          'Test Show',
          'Test description',
          '2023-01-01',
          '/path/to/poster.jpg',
          '/path/to/backdrop.jpg',
          8.5,
          'TV-MA',
          2,
          10,
          'Running',
          'Scripted',
          1,
          '2023-12-01',
          1001,
          1002,
          'Test Network',
        ]),
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(show.id).toBe(5);
    });

    test('save() should rollback transaction on error', async () => {
      const mockError = new Error('Database error');
      mockConnection.execute.mockRejectedValueOnce(mockError);

      const show = new Show(
        12345,
        'Test Show',
        'Test description',
        '2023-01-01',
        '/path/to/poster.jpg',
        '/path/to/backdrop.jpg',
        8.5,
        'TV-MA',
      );

      await expect(show.save()).rejects.toThrow('Database error');
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    test('update() should update show in DB with transaction', async () => {
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]);

      const show = new Show(
        12345,
        'Updated Show',
        'Updated description',
        '2023-01-01',
        '/path/to/poster.jpg',
        '/path/to/backdrop.jpg',
        8.5,
        'TV-MA',
        5, // id
        [1, 2], // streamingServices
        10, // episodeCount
        2, // seasonCount
      );

      const result = await show.update();

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE shows SET'),
        expect.arrayContaining([
          'Updated Show',
          'Updated description',
          '2023-01-01',
          '/path/to/poster.jpg',
          '/path/to/backdrop.jpg',
          8.5,
          'TV-MA',
          10,
          2, // season & episode counts
          12345, // tmdbId
        ]),
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('update() should return false when no rows are affected', async () => {
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 0 } as ResultSetHeader]);

      const show = new Show(
        99999,
        'Nonexistent Show',
        'Description',
        '2023-01-01',
        '/path/to/poster.jpg',
        '/path/to/backdrop.jpg',
        8.5,
        'TV-MA',
        5, // id
      );

      const result = await show.update();

      expect(result).toBe(false);
    });
  });

  describe('saveFavorite()', () => {
    test('saveFavorite() should add show to profile favorites', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]) // Insert show_watch_status
        .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }] as RowDataPacket[]]) // Get seasons
        .mockResolvedValueOnce([{ affectedRows: 2 } as ResultSetHeader]) // Batch insert seasons
        .mockResolvedValueOnce([{ affectedRows: 10 } as ResultSetHeader]); // Batch insert episodes

      const show = new Show(
        12345,
        'Test Show',
        'Description',
        '2023-01-01',
        '/path/to/poster.jpg',
        '/path/to/backdrop.jpg',
        8.5,
        'TV-MA',
        5, // id
      );

      await show.saveFavorite('123', true);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledTimes(4);
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });

  describe('removeFavorite()', () => {
    test('removeFavorite() should remove show and related content from profile favorites', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }] as RowDataPacket[]]) // Get seasons
        .mockResolvedValueOnce([{ affectedRows: 10 } as ResultSetHeader]) // Delete episode watch statuses
        .mockResolvedValueOnce([{ affectedRows: 2 } as ResultSetHeader]) // Delete season watch statuses
        .mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]); // Delete show watch status

      const show = new Show(
        12345,
        'Test Show',
        'Description',
        '2023-01-01',
        '/path/to/poster.jpg',
        '/path/to/backdrop.jpg',
        8.5,
        'TV-MA',
        5, // id
      );

      await show.removeFavorite('123');

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledTimes(4);
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });

  describe('static methods', () => {
    test('findById() should return a show when found', async () => {
      const mockShow = {
        id: 5,
        tmdb_id: 12345,
        title: 'Test Show',
        description: 'Test description',
        release_date: '2023-01-01',
        poster_image: '/path/to/poster.jpg',
        backdrop_image: '/path/to/backdrop.jpg',
        user_rating: 8.5,
        content_rating: 'TV-MA',
        season_count: 2,
        episode_count: 10,
      };

      mockPool.execute.mockResolvedValueOnce([[mockShow] as RowDataPacket[]]);

      const show = await Show.findById(5);

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM shows WHERE id = ?', [5]);
      expect(show).not.toBeNull();
      expect(show?.id).toBe(5);
      expect(show?.title).toBe('Test Show');
    });

    test('findById() should return null when show not found', async () => {
      mockPool.execute.mockResolvedValueOnce([[] as RowDataPacket[]]);
      const show = await Show.findById(999);
      expect(show).toBeNull();
    });

    test('findByTMDBId() should return a show when found', async () => {
      const mockShow = {
        id: 5,
        tmdb_id: 12345,
        title: 'Test Show',
        description: 'Test description',
        release_date: '2023-01-01',
        poster_image: '/path/to/poster.jpg',
        backdrop_image: '/path/to/backdrop.jpg',
        user_rating: 8.5,
        content_rating: 'TV-MA',
      };

      mockPool.execute.mockResolvedValueOnce([[mockShow] as RowDataPacket[]]);

      const show = await Show.findByTMDBId(12345);

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM shows WHERE tmdb_id = ?', [12345]);
      expect(show).not.toBeNull();
      expect(show?.tmdb_id).toBe(12345);
      expect(show?.title).toBe('Test Show');
    });

    test('updateWatchStatus() should update show watch status', async () => {
      mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]);
      const result = await Show.updateWatchStatus('123', 5, 'WATCHED');
      expect(mockPool.execute).toHaveBeenCalledWith(
        'UPDATE show_watch_status SET status = ? WHERE profile_id = ? AND show_id = ?',
        ['WATCHED', '123', 5],
      );
      expect(result).toBe(true);
    });

    test('updateWatchStatus() should return false when no rows affected', async () => {
      mockPool.execute.mockResolvedValueOnce([{ affectedRows: 0 } as ResultSetHeader]);
      const result = await Show.updateWatchStatus('123', 999, 'WATCHED');
      expect(result).toBe(false);
    });

    test('getAllShowsForProfile() should return shows for a profile', async () => {
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

      const shows = await Show.getAllShowsForProfile('123');

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM profile_shows where profile_id = ?', [123]);
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
});
