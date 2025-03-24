import { BadRequestError } from '../middleware/errorMiddleware';
import Profile from '../models/profile';
import { AccountAndProfileIdsParams, AccountIdParam } from '../schema/accountSchema';
import { showService } from '../services/showService';
import { getProfileMovieStatistics } from './moviesController';
import { NextFunction, Request, Response } from 'express';

/**
 * Get statistics (shows, movies and watch progress) for an account
 *
 * @route GET /api/v1/accounts/:accountId/statistics
 */
export async function getAccountStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params as AccountIdParam;
    const profiles = await Profile.getAllByAccountId(Number(accountId));
    if (!profiles || profiles.length === 0) {
      throw new BadRequestError(`No profiles found for account ${accountId}`);
    }

    const profileStats = await Promise.all(
      profiles.map(async (profile) => {
        const profileId = profile.id!.toString();
        const showStats = await showService.getProfileShowStatistics(profileId);
        const movieStats = await getProfileMovieStatistics(profileId);
        const progress = await showService.getProfileWatchProgress(profileId);

        return {
          profileId: profile.id,
          profileName: profile.name,
          showStatistics: showStats,
          movieStatistics: movieStats,
          progress,
        };
      }),
    );

    const aggregatedStats = aggregateAccountStatistics(profileStats);

    res.status(200).json({
      message: 'Successfully retrieved account statistics',
      results: {
        profileCount: profiles.length,
        uniqueContent: aggregatedStats.uniqueContent,
        showStatistics: aggregatedStats.shows,
        movieStatistics: aggregatedStats.movies,
        episodeStatistics: aggregatedStats.episodes,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get statistics (shows, movies and watch progress) for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics
 */
export async function getProfileStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const showStatistics = await showService.getProfileShowStatistics(profileId);
    const movieStatistics = await getProfileMovieStatistics(profileId);
    const episodeWatchProgress = await showService.getProfileWatchProgress(profileId);

    res.status(200).json({
      message: 'Successfully retrieved profile statistics',
      results: { showStatistics, movieStatistics, episodeWatchProgress },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Represents aggregate statistics for an account
 */
interface AggregatedStats {
  shows: {
    total: number;
    watchStatusCounts: {
      watched: number;
      watching: number;
      notWatched: number;
    };
    genreDistribution: Record<string, number>;
    serviceDistribution: Record<string, number>;
    watchProgress: number;
  };
  movies: {
    total: number;
    watchStatusCounts: {
      watched: number;
      notWatched: number;
    };
    genreDistribution: Record<string, number>;
    serviceDistribution: Record<string, number>;
    watchProgress: number;
  };
  episodes: {
    totalEpisodes: number;
    watchedEpisodes: number;
    watchProgress: number;
  };
  uniqueContent: {
    showCount: number;
    movieCount: number;
  };
}

/**
 * Aggregates statistics from multiple profiles into a single account-level view
 *
 * @param profileStats - Array of profile statistics
 * @returns Aggregated statistics across all profiles
 */
function aggregateAccountStatistics(profileStats: any[]): AggregatedStats {
  if (!profileStats.length) {
    return createEmptyAggregateStats();
  }

  // Track unique show and movie IDs
  const uniqueShowIds = new Set<number>();
  const uniqueMovieIds = new Set<number>();

  // Initialize aggregates
  const aggregate = {
    shows: {
      total: 0,
      watchStatusCounts: { watched: 0, watching: 0, notWatched: 0 },
      genreDistribution: {} as Record<string, number>,
      serviceDistribution: {} as Record<string, number>,
    },
    movies: {
      total: 0,
      watchStatusCounts: { watched: 0, notWatched: 0 },
      genreDistribution: {} as Record<string, number>,
      serviceDistribution: {} as Record<string, number>,
    },
    episodes: {
      totalEpisodes: 0,
      watchedEpisodes: 0,
    },
  };

  // Combine statistics from all profiles
  profileStats.forEach((profileStat) => {
    // Shows
    aggregate.shows.total += profileStat.showStatistics.total;
    aggregate.shows.watchStatusCounts.watched += profileStat.showStatistics.watchStatusCounts.watched;
    aggregate.shows.watchStatusCounts.watching += profileStat.showStatistics.watchStatusCounts.watching;
    aggregate.shows.watchStatusCounts.notWatched += profileStat.showStatistics.watchStatusCounts.notWatched;

    // Movies
    aggregate.movies.total += profileStat.movieStatistics.total;
    aggregate.movies.watchStatusCounts.watched += profileStat.movieStatistics.watchStatusCounts.watched;
    aggregate.movies.watchStatusCounts.notWatched += profileStat.movieStatistics.watchStatusCounts.notWatched;

    // Episodes
    aggregate.episodes.totalEpisodes += profileStat.progress.totalEpisodes;
    aggregate.episodes.watchedEpisodes += profileStat.progress.watchedEpisodes;

    // Genres for shows
    Object.entries(profileStat.showStatistics.genreDistribution).forEach(([genre, count]) => {
      aggregate.shows.genreDistribution[genre] = (aggregate.shows.genreDistribution[genre] || 0) + (count as number);
    });

    // Genres for movies
    Object.entries(profileStat.movieStatistics.genreDistribution).forEach(([genre, count]) => {
      aggregate.movies.genreDistribution[genre] = (aggregate.movies.genreDistribution[genre] || 0) + (count as number);
    });

    // Streaming services for shows
    Object.entries(profileStat.showStatistics.serviceDistribution).forEach(([service, count]) => {
      aggregate.shows.serviceDistribution[service] =
        (aggregate.shows.serviceDistribution[service] || 0) + (count as number);
    });

    // Streaming services for movies
    Object.entries(profileStat.movieStatistics.serviceDistribution).forEach(([service, count]) => {
      aggregate.movies.serviceDistribution[service] =
        (aggregate.movies.serviceDistribution[service] || 0) + (count as number);
    });

    // Track unique show IDs
    if (profileStat.progress.showsProgress) {
      profileStat.progress.showsProgress.forEach((show: any) => {
        uniqueShowIds.add(show.showId);
      });
    }

    // We should track unique movie IDs if available in the data
    // This is a placeholder - adjust based on your actual data structure
    if (profileStat.movieStatistics && profileStat.movieStatistics.movies) {
      profileStat.movieStatistics.movies.forEach((movie: any) => {
        if (movie.movie_id) {
          uniqueMovieIds.add(movie.movie_id);
        }
      });
    }
  });

  // Calculate aggregated watch progress percentages
  const showWatchProgress =
    aggregate.shows.total > 0
      ? Math.round((aggregate.shows.watchStatusCounts.watched / aggregate.shows.total) * 100)
      : 0;

  const movieWatchProgress =
    aggregate.movies.total > 0
      ? Math.round((aggregate.movies.watchStatusCounts.watched / aggregate.movies.total) * 100)
      : 0;

  const episodeWatchProgress =
    aggregate.episodes.totalEpisodes > 0
      ? Math.round((aggregate.episodes.watchedEpisodes / aggregate.episodes.totalEpisodes) * 100)
      : 0;

  // Create the final result object with proper structure
  return {
    uniqueContent: {
      showCount: uniqueShowIds.size,
      movieCount: uniqueMovieIds.size,
    },
    shows: {
      ...aggregate.shows,
      watchProgress: showWatchProgress,
    },
    movies: {
      ...aggregate.movies,
      watchProgress: movieWatchProgress,
    },
    episodes: {
      ...aggregate.episodes,
      watchProgress: episodeWatchProgress,
    },
  };
}

/**
 * Creates an empty aggregated stats object
 * Used when there are no profiles or no data
 */
function createEmptyAggregateStats(): AggregatedStats {
  return {
    uniqueContent: {
      showCount: 0,
      movieCount: 0,
    },
    shows: {
      total: 0,
      watchStatusCounts: {
        watched: 0,
        watching: 0,
        notWatched: 0,
      },
      genreDistribution: {},
      serviceDistribution: {},
      watchProgress: 0,
    },
    movies: {
      total: 0,
      watchStatusCounts: {
        watched: 0,
        notWatched: 0,
      },
      genreDistribution: {},
      serviceDistribution: {},
      watchProgress: 0,
    },
    episodes: {
      totalEpisodes: 0,
      watchedEpisodes: 0,
      watchProgress: 0,
    },
  };
}
