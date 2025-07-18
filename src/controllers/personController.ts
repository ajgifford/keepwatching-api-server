import { PersonIdParams } from '@ajgifford/keepwatching-common-server/schema';
import { personService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

/**
 * Get person details from internal database
 *
 * Retrieves comprehensive person information from the internal database,
 * including biographical data and curated filmography with ratings and
 * episode counts for both movies and TV shows.
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/person/:personId
 * @param {Request} req - Express request containing accountId, profileId, and personId in params
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Response} 200 with Person object containing full details and filmography
 * @throws {Error} When person is not found or database error occurs
 * @example
 * // GET /api/v1/accounts/123/profiles/456/person/789
 * // Response:
 * {
 *   "message": "Successfully retrieved person details",
 *   "person": {
 *     "id": 789,
 *     "tmdbId": 17419,
 *     "name": "Bryan Cranston",
 *     "gender": 2,
 *     "biography": "Bryan Lee Cranston is an American actor...",
 *     "profileImage": "https://image.tmdb.org/t/p/w500/profile.jpg",
 *     "birthdate": "1956-03-07",
 *     "deathdate": null,
 *     "placeOfBirth": "Hollywood, California, USA",
 *     "movieCredits": [...],
 *     "showCredits": [...]
 *   }
 * }
 */
export const getPersonDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { personId } = req.params as unknown as PersonIdParams;

    const person = await personService.getPersonDetails(personId);
    res.status(200).json({
      message: 'Successfully retrieved person details',
      person,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get person details from TMDB
 *
 * Retrieves real-time person information directly from The Movie Database (TMDB),
 * including current biographical data, popularity metrics, and department information.
 * This provides the most up-to-date information available from TMDB.
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/tmdbPerson/:personId
 * @param {Request} req - Express request containing accountId, profileId, and personId (TMDB ID) in params
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Response} 200 with SearchPerson object containing TMDB data
 * @throws {Error} When person is not found in TMDB or API error occurs
 * @example
 * // GET /api/v1/accounts/123/profiles/456/tmdbPerson/17419
 * // Response:
 * {
 *   "message": "Successfully retrieved TMDB person details",
 *   "person": {
 *     "id": 17419,
 *     "name": "Bryan Cranston",
 *     "profileImage": "https://image.tmdb.org/t/p/w500/profile.jpg",
 *     "department": "Acting",
 *     "popularity": 45.678,
 *     "biography": "Bryan Lee Cranston (born March 7, 1956)...",
 *     "birthday": "1956-03-07",
 *     "birthplace": "Hollywood, California, USA",
 *     "deathday": null
 *   }
 * }
 */
export const getTMDBPersonDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { personId } = req.params as unknown as PersonIdParams;

    const person = await personService.getTMDBPersonDetails(personId);
    res.status(200).json({
      message: 'Successfully retrieved TMDB person details',
      person,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get person's filmography credits from TMDB
 *
 * Retrieves comprehensive filmography data from TMDB including both cast and crew
 * credits across movies and TV shows. Credits are organized by type (cast vs crew)
 * and include character names, job descriptions, and content metadata.
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/tmdbPerson/:personId/credits
 * @param {Request} req - Express request containing accountId, profileId, and personId (TMDB ID) in params
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Response} 200 with SearchPersonCredits object containing organized filmography
 * @throws {Error} When person is not found in TMDB or API error occurs
 * @example
 * // GET /api/v1/accounts/123/profiles/456/tmdbPerson/17419/credits
 * // Response:
 * {
 *   "message": "Successfully retrieved TMDB person credits",
 *   "credits": {
 *     "cast": [
 *       {
 *         "tmdbId": 1396,
 *         "title": "Breaking Bad",
 *         "posterImage": "https://image.tmdb.org/t/p/w500/poster.jpg",
 *         "releaseDate": "2008-01-20",
 *         "character": "Walter White",
 *         "job": "Actor",
 *         "mediaType": "tv",
 *         "isCast": true
 *       }
 *     ],
 *     "crew": [
 *       {
 *         "tmdbId": 1396,
 *         "title": "Breaking Bad",
 *         "posterImage": "https://image.tmdb.org/t/p/w500/poster.jpg",
 *         "releaseDate": "2008-01-20",
 *         "character": "",
 *         "job": "Executive Producer",
 *         "mediaType": "tv",
 *         "isCast": false
 *       }
 *     ]
 *   }
 * }
 */
export const getTMDBPersonCredits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { personId } = req.params as unknown as PersonIdParams;

    const credits = await personService.getTMDBPersonCredits(personId);
    res.status(200).json({
      message: 'Successfully retrieved TMDB person credits',
      credits,
    });
  } catch (error) {
    next(error);
  }
};
