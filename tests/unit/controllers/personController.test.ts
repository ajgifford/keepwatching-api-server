import { personService } from '@ajgifford/keepwatching-common-server/services';
import { getPersonDetails, getTMDBPersonCredits, getTMDBPersonDetails } from '@controllers/personController';

// Mock the external packages
jest.mock('@ajgifford/keepwatching-common-server/services', () => ({
  personService: {
    getPersonDetails: jest.fn(),
    getTMDBPersonDetails: jest.fn(),
    getTMDBPersonCredits: jest.fn(),
  },
}));

describe('personController', () => {
  let req: any, res: any, next: jest.Mock;

  const mockPerson = {
    id: 789,
    tmdbId: 17419,
    name: 'Bryan Cranston',
    gender: 2,
    biography: 'Bryan Lee Cranston is an American actor...',
    profileImage: 'https://image.tmdb.org/t/p/w500/profile.jpg',
    birthdate: '1956-03-07',
    deathdate: null,
    placeOfBirth: 'Hollywood, California, USA',
    movieCredits: [],
    showCredits: [],
  };

  const mockTMDBPerson = {
    id: 17419,
    name: 'Bryan Cranston',
    profileImage: 'https://image.tmdb.org/t/p/w500/profile.jpg',
    department: 'Acting',
    popularity: 45.678,
    biography: 'Bryan Lee Cranston (born March 7, 1956)...',
    birthday: '1956-03-07',
    birthplace: 'Hollywood, California, USA',
    deathday: null,
  };

  const mockCredits = {
    cast: [
      {
        tmdbId: 1396,
        title: 'Breaking Bad',
        posterImage: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        releaseDate: '2008-01-20',
        character: 'Walter White',
        job: 'Actor',
        mediaType: 'tv',
        isCast: true,
      },
    ],
    crew: [
      {
        tmdbId: 1396,
        title: 'Breaking Bad',
        posterImage: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        releaseDate: '2008-01-20',
        character: '',
        job: 'Executive Producer',
        mediaType: 'tv',
        isCast: false,
      },
    ],
  };

  beforeEach(() => {
    req = {
      params: { accountId: 123, profileId: 456, personId: 789 },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getPersonDetails', () => {
    it('should retrieve person details successfully', async () => {
      (personService.getPersonDetails as jest.Mock).mockResolvedValue(mockPerson);

      await getPersonDetails(req, res, next);

      expect(personService.getPersonDetails).toHaveBeenCalledWith(789);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved person details',
        person: mockPerson,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when retrieving person details', async () => {
      const error = new Error('Person not found');
      (personService.getPersonDetails as jest.Mock).mockRejectedValue(error);

      await getPersonDetails(req, res, next);

      expect(personService.getPersonDetails).toHaveBeenCalledWith(789);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection error');
      (personService.getPersonDetails as jest.Mock).mockRejectedValue(error);

      await getPersonDetails(req, res, next);

      expect(personService.getPersonDetails).toHaveBeenCalledWith(789);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTMDBPersonDetails', () => {
    it('should retrieve TMDB person details successfully', async () => {
      (personService.getTMDBPersonDetails as jest.Mock).mockResolvedValue(mockTMDBPerson);

      await getTMDBPersonDetails(req, res, next);

      expect(personService.getTMDBPersonDetails).toHaveBeenCalledWith(789);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved TMDB person details',
        person: mockTMDBPerson,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when retrieving TMDB person details', async () => {
      const error = new Error('Person not found in TMDB');
      (personService.getTMDBPersonDetails as jest.Mock).mockRejectedValue(error);

      await getTMDBPersonDetails(req, res, next);

      expect(personService.getTMDBPersonDetails).toHaveBeenCalledWith(789);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle TMDB API errors', async () => {
      const error = new Error('TMDB API error');
      (personService.getTMDBPersonDetails as jest.Mock).mockRejectedValue(error);

      await getTMDBPersonDetails(req, res, next);

      expect(personService.getTMDBPersonDetails).toHaveBeenCalledWith(789);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTMDBPersonCredits', () => {
    it('should retrieve TMDB person credits successfully', async () => {
      (personService.getTMDBPersonCredits as jest.Mock).mockResolvedValue(mockCredits);

      await getTMDBPersonCredits(req, res, next);

      expect(personService.getTMDBPersonCredits).toHaveBeenCalledWith(789);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved TMDB person credits',
        credits: mockCredits,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors when retrieving TMDB person credits', async () => {
      const error = new Error('Credits not found');
      (personService.getTMDBPersonCredits as jest.Mock).mockRejectedValue(error);

      await getTMDBPersonCredits(req, res, next);

      expect(personService.getTMDBPersonCredits).toHaveBeenCalledWith(789);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle TMDB API errors for credits', async () => {
      const error = new Error('TMDB API error');
      (personService.getTMDBPersonCredits as jest.Mock).mockRejectedValue(error);

      await getTMDBPersonCredits(req, res, next);

      expect(personService.getTMDBPersonCredits).toHaveBeenCalledWith(789);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle empty credits response', async () => {
      const emptyCredits = { cast: [], crew: [] };
      (personService.getTMDBPersonCredits as jest.Mock).mockResolvedValue(emptyCredits);

      await getTMDBPersonCredits(req, res, next);

      expect(personService.getTMDBPersonCredits).toHaveBeenCalledWith(789);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully retrieved TMDB person credits',
        credits: emptyCredits,
      });
    });
  });
});
