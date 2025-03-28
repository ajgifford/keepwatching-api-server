import { cliLogger, httpLogger } from '../logger/logger';
import { ErrorMessages } from '../logger/loggerModel';
import Movie from '../models/movie';
import { Change, ContentUpdates } from '../types/contentTypes';
import { SUPPORTED_CHANGE_KEYS, generateDateRange, sleep } from '../utils/changesUtility';
import { getUSMPARating } from '../utils/contentUtility';
import { getUSWatchProviders } from '../utils/watchProvidersUtility';
import { errorService } from './errorService';
import { getTMDBService } from './tmdbService';

/**
 * Updates movies that might have changes
 */
export async function updateMovies() {
  try {
    const movies = await Movie.getMoviesForUpdates();
    cliLogger.info(`Found ${movies.length} movies to check for updates`);
    const { currentDate, pastDate } = generateDateRange(10);

    for (const movie of movies) {
      try {
        // Add rate limiting between requests to avoid API throttling
        await sleep(500);
        await checkForMovieChanges(movie, pastDate, currentDate);
      } catch (error) {
        // Log error but continue with next movie
        cliLogger.error(`Failed to check for changes in movie ID ${movie.id}`, error);
      }
    }
  } catch (error) {
    cliLogger.error('Unexpected error while checking for movie updates', error);
    httpLogger.error(ErrorMessages.MoviesChangeFail, { error });
    throw error; // Re-throw to be caught by the job handler
  }
}

/**
 * Check for changes to a specific movie and update if necessary
 * @param content Movie to check for changes
 * @param pastDate Date past date used as the start of the change window
 * @param currentDate Date current date used as the end of the change window
 */
async function checkForMovieChanges(content: ContentUpdates, pastDate: string, currentDate: string) {
  const tmdbService = getTMDBService();

  try {
    // Get changes for this movie from TMDB
    const changesData = await tmdbService.getMovieChanges(content.tmdb_id, pastDate, currentDate);
    const changes: Change[] = changesData.changes || [];

    // Filter for supported changes only
    const supportedChanges = changes.filter((item) => SUPPORTED_CHANGE_KEYS.includes(item.key));

    if (supportedChanges.length > 0) {
      // Fetch updated movie details from TMDB
      const movieDetails = await tmdbService.getMovieDetails(content.tmdb_id);

      // Create new Movie object with updated data
      const updatedMovie = new Movie(
        movieDetails.id,
        movieDetails.title,
        movieDetails.overview,
        movieDetails.release_date,
        movieDetails.runtime,
        movieDetails.poster_path,
        movieDetails.backdrop_path,
        movieDetails.vote_average,
        getUSMPARating(movieDetails.release_dates),
        content.id,
        getUSWatchProviders(movieDetails, 9998),
        movieDetails.genres.map((genre: { id: any }) => genre.id),
      );

      // Update the movie in our database
      await updatedMovie.update();
    }
  } catch (error) {
    cliLogger.error(`Error checking changes for movie ID ${content.id}`, error);
    httpLogger.error(ErrorMessages.MovieChangeFail, { error, movieId: content.id });
    throw errorService.handleError(error, `checkForMovieChanges(${content.id})`);
  }
}
