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

describe('showRepository', () => {
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
    it('should insert show into DB with transaction', async () => {
      mockConnection.execute.mockResolvedValueOnce([{ insertId: 5, affectedRows: 1 } as ResultSetHeader]);
      const show = showsDb.createShow(
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

      const result = await showsDb.saveShow(show);

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

    it('should rollback transaction on error', async () => {
      const mockError = new Error('Database error');
      mockConnection.execute.mockRejectedValueOnce(mockError);

      const show = showsDb.createShow(
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

      await expect(showsDb.saveShow(show)).rejects.toThrow('Database error');
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('should update show in DB with transaction', async () => {
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]);

      const show = showsDb.createShow(
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

      const result = await showsDb.updateShow(show);

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

    it('should return false when no rows are affected', async () => {
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 0 } as ResultSetHeader]);

      const show = showsDb.createShow(
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

      const result = await showsDb.updateShow(show);

      expect(result).toBe(false);
    });
  });

  describe('saveShowGenre', () => {
    it('should save the genres for a show', () => {});
  });

  describe('saveShowStreamingServices', () => {
    it('should save the streaming services for a show', () => {});
  });

  describe('getShowsForUpdates', () => {
    it('should save the streaming services for a show', () => {});
  });

  describe('findShowById', () => {
    it('should return a show when found', async () => {
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

      const show = await showsDb.findShowById(5);

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM shows WHERE id = ?', [5]);
      expect(show).not.toBeNull();
      expect(show?.id).toBe(5);
      expect(show?.title).toBe('Test Show');
    });

    it('should return null when show not found', async () => {
      mockPool.execute.mockResolvedValueOnce([[] as RowDataPacket[]]);
      const show = await showsDb.findShowById(999);
      expect(show).toBeNull();
    });
  });

  describe('findShowByTMDBId', () => {
    it('should return a show when found', async () => {
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

      const show = await showsDb.findShowByTMDBId(12345);

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM shows WHERE tmdb_id = ?', [12345]);
      expect(show).not.toBeNull();
      expect(show?.tmdb_id).toBe(12345);
      expect(show?.title).toBe('Test Show');
    });
  });
});
